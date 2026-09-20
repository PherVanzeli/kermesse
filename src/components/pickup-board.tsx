"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PickupOrder = {
  id: string;
  customer_name: string | null;
  pickup_code: string;
  total_cents: number;
  status: "awaiting_payment" | "paid" | "preparing" | "ready" | "delivered" | "cancelled";
  created_at: string;
  items: { quantity: number; name?: string }[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function PickupBoard({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/orders`, { cache: "no-store" });
      const result = (await response.json()) as { orders?: PickupOrder[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar os pedidos.");
      setOrders(result.orders ?? []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOrders(), 0);
    const interval = window.setInterval(() => void loadOrders(), 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const readyOrders = orders.filter((order) => order.status === "ready");
  const selectedOrder = useMemo(() => {
    const normalized = code.trim().toUpperCase();
    return normalized ? readyOrders.find((order) => order.pickup_code.toUpperCase() === normalized) : null;
  }, [code, readyOrders]);

  const deliver = async () => {
    if (!selectedOrder) return;
    const response = await fetch(`/api/events/${eventId}/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder.id, status: "delivered" }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Não foi possível registrar a entrega.");
      return;
    }
    setCode("");
    await loadOrders();
  };

  return (
    <div>
      {error && <p className="mb-4 rounded-2xl bg-[#fde9e4] p-4 text-sm font-semibold text-[#b6452f]">{error}</p>}
      <div className="rounded-3xl border border-[#f0e3d4] bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Buscar retirada</p>
        <h2 className="mt-1 text-2xl font-black text-[#2f241d]">Digite a senha do pedido</h2>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ex.: A-042"
            aria-label="Senha do pedido"
            className="w-full rounded-2xl border border-[#eadbca] px-4 py-4 text-xl font-black tracking-wider outline-none focus:border-[#e85d3f]"
          />
          <button onClick={() => void loadOrders()} className="rounded-2xl bg-[#2f8f75] px-6 py-4 font-bold text-white">
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-5 rounded-3xl bg-white p-8 text-center text-[#765f4d]">Carregando pedidos...</p>
      ) : selectedOrder ? (
        <article className="mt-5 rounded-3xl border border-[#2f8f75] bg-[#e8f5ef] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-4xl font-black text-[#2f8f75]">{selectedOrder.pickup_code}</p>
              <p className="mt-1 text-[#5e493b]">{selectedOrder.customer_name || "Cliente"}</p>
            </div>
            <p className="text-xl font-black text-[#2f241d]">{formatPrice(selectedOrder.total_cents)}</p>
          </div>
          <ul className="mt-5 space-y-2 border-t border-[#b9dfcf] pt-4 text-[#5e493b]">
            {selectedOrder.items.map((item, index) => (
              <li key={`${selectedOrder.id}-${index}`} className="font-semibold">
                {item.quantity}x {item.name ?? "Produto"}
              </li>
            ))}
          </ul>
          <button onClick={() => void deliver()} className="mt-6 w-full rounded-2xl bg-[#2f8f75] px-5 py-4 font-bold text-white">
            Confirmar entrega
          </button>
        </article>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-[#ddcabe] bg-white p-8 text-center text-[#765f4d]">
          {code ? "Pedido não encontrado entre os pedidos prontos." : `${readyOrders.length} pedido(s) pronto(s) para retirada.`}
        </div>
      )}
    </div>
  );
}
