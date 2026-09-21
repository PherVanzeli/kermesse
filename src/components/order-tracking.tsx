"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type Order = {
  pickup_code: string;
  customer_name: string;
  total_cents: number;
  status: "awaiting_payment" | "paid" | "preparing" | "ready" | "delivered" | "cancelled";
  created_at: string;
  items: { name: string; quantity: number }[];
};

const steps = [
  ["awaiting_payment", "Pedido recebido"],
  ["paid", "Pagamento confirmado"],
  ["preparing", "Preparando"],
  ["ready", "Pronto para retirada"],
  ["delivered", "Entregue"],
] as const;

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function OrderTracking({ token, initialOrder }: { token: string; initialOrder: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [error, setError] = useState("");
  const [pickupQr, setPickupQr] = useState("");

  useEffect(() => {
    void QRCode.toDataURL(`kermesse:pickup:${token}`, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
    }).then(setPickupQr);
  }, [token]);

  const loadOrder = useCallback(async () => {
    const response = await fetch(`/api/orders/public/${token}`, { cache: "no-store" });
    const result = (await response.json()) as { order?: Order; error?: string };
    if (!response.ok || !result.order) {
      setError(result.error ?? "Não foi possível atualizar o pedido.");
      return;
    }
    setOrder(result.order);
  }, [token]);

  useEffect(() => {
    if (order.status === "delivered" || order.status === "cancelled") return;
    const interval = window.setInterval(() => void loadOrder(), 5000);
    return () => window.clearInterval(interval);
  }, [loadOrder, order.status]);

  const currentIndex = steps.findIndex(([status]) => status === order.status);

  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-8">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Kermesse</p>
        <h1 className="mt-2 text-3xl font-black text-[#2f241d]">Acompanhe seu pedido</h1>
        <p className="mt-2 text-[#765f4d]">{order.customer_name}</p>
        {error && <p className="mt-4 rounded-2xl bg-[#fde9e4] p-4 text-sm font-semibold text-[#b6452f]">{error}</p>}
        <section className="mt-6 rounded-3xl bg-[#2f241d] p-6 text-center text-white">
          <p className="text-sm text-[#ddcabe]">Sua senha</p>
          <p className="mt-2 text-5xl font-black tracking-wider text-[#f6c453]">{order.pickup_code}</p>
        </section>
        <section className="mt-5 rounded-3xl border border-[#f0e3d4] bg-white p-6">
          <h2 className="text-xl font-black text-[#2f241d]">Status do pedido</h2>
          <div className="mt-5 space-y-4">
            {steps.map(([status, label], index) => (
              <div key={status} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                  index <= currentIndex ? "bg-[#2f8f75] text-white" : "bg-[#eadbca] text-[#947b68]"
                }`}>
                  {index <= currentIndex ? "✓" : index + 1}
                </span>
                <span className={index <= currentIndex ? "font-bold text-[#2f241d]" : "text-[#947b68]"}>{label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-5 rounded-3xl border border-[#f0e3d4] bg-white p-6">
          <h2 className="text-xl font-black text-[#2f241d]">Itens</h2>
          <ul className="mt-4 space-y-2 text-[#5e493b]">
            {order.items.map((item, index) => <li key={`${item.name}-${index}`}>{item.quantity}x {item.name}</li>)}
          </ul>
          <p className="mt-5 flex justify-between border-t border-[#eadbca] pt-4">
            <span className="font-bold text-[#765f4d]">Total</span>
            <strong className="text-xl text-[#2f241d]">{formatPrice(order.total_cents)}</strong>
          </p>
        </section>
        {order.status === "ready" && (
          <section className="mt-5 rounded-3xl bg-[#e8f5ef] p-5 text-center">
            <p className="font-bold text-[#2f8f75]">Seu pedido está pronto.</p>
            {pickupQr && <img src={pickupQr} alt="QR Code para retirada" className="mx-auto mt-4 h-40 w-40 rounded-xl bg-white p-2" />}
            <p className="mt-3 text-sm text-[#2f8f75]">Apresente este QR Code ou sua senha no balcão.</p>
          </section>
        )}
      </div>
    </main>
  );
}
