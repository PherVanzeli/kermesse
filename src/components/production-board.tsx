"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Order = {
  id: string;
  customer_name: string | null;
  pickup_code: string;
  public_token: string;
  total_cents: number;
  status: "awaiting_payment" | "paid" | "preparing" | "ready" | "delivered" | "cancelled";
  created_at: string;
  items: { quantity: number; name?: string; unitPriceCents: number }[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ProductionBoard({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickupOrder, setPickupOrder] = useState<Order | null>(null);
  const [pickupCode, setPickupCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/orders`, { cache: "no-store" });
      const result = (await response.json()) as { orders?: Order[]; error?: string };
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

  useEffect(() => {
    if (!scannerOpen) return;
    const scanner = new Html5Qrcode("production-pickup-scanner");
    scannerRef.current = scanner;
    void scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const parts = decodedText.split(":");
          const orderId =
            parts[0] === "kermesse" &&
            parts[1] === "pickup" &&
            (parts.length === 3 || (parts.length === 4 && parts[2] === eventId))
              ? parts[parts.length - 1]
              : "";
          const found = orders.find((order) => order.public_token === orderId && order.status === "ready");
          if (!found) {
            setError("QR Code inválido ou pedido ainda não está pronto.");
            return;
          }
          setPickupOrder(found);
          setScannerOpen(false);
          void scanner.stop().catch(() => undefined);
        },
        () => undefined,
      )
      .catch(() => setError("Não foi possível acessar a câmera. Use a busca pela senha."));
    return () => {
      if (scannerRef.current) {
        void scannerRef.current.stop().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, [eventId, orders, scannerOpen]);

  const updateStatus = async (orderId: string, status: "preparing" | "ready") => {
    const response = await fetch(`/api/events/${eventId}/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Não foi possível atualizar o pedido.");
      return;
    }
    await loadOrders();
  };

  const confirmPickup = async () => {
    if (!pickupOrder) return;
    const response = await fetch(`/api/events/${eventId}/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: pickupOrder.id, status: "delivered" }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Não foi possível registrar a entrega.");
      return;
    }
    setPickupOrder(null);
    setPickupCode("");
    await loadOrders();
  };

  const findPickupOrder = () => {
    const normalizedCode = pickupCode.trim().toUpperCase();
    const found = orders.find(
      (order) => order.status === "ready" && order.pickup_code.toUpperCase() === normalizedCode,
    );
    if (!found) {
      setError("Nenhum pedido pronto encontrado com essa senha.");
      return;
    }
    setError("");
    setPickupOrder(found);
  };

  const columns = [
    { title: "Novos", statuses: ["awaiting_payment", "paid"], action: "preparing" as const },
    { title: "Preparando", statuses: ["preparing"], action: "ready" as const },
    { title: "Prontos", statuses: ["ready"], action: null },
  ];

  return (
    <div>
      {error && <p className="mb-4 rounded-2xl bg-[#fde9e4] p-4 text-sm font-semibold text-[#b6452f]">{error}</p>}
      {loading ? (
        <p className="rounded-3xl bg-white p-8 text-center text-[#765f4d]">Carregando pedidos...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const columnOrders = orders.filter((order) => column.statuses.includes(order.status));
            return (
              <section key={column.title} className="rounded-3xl border border-[#f0e3d4] bg-[#fffaf3] p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#2f241d]">{column.title}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#765f4d]">{columnOrders.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {columnOrders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-[#eadbca] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-black text-[#e85d3f]">{order.pickup_code}</p>
                          <p className="text-xs text-[#947b68]">{order.customer_name || "Cliente"} · {formatTime(order.created_at)}</p>
                        </div>
                        <p className="font-bold text-[#2f241d]">{formatPrice(order.total_cents)}</p>
                      </div>
                      <ul className="mt-3 border-t border-[#f0e3d4] pt-3 text-sm text-[#5e493b]">
                        {order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity}x {item.name ?? "Produto"}</li>)}
                      </ul>
                      {column.action && (
                        <button
                          onClick={() => void updateStatus(order.id, column.action!)}
                          className="mt-4 w-full rounded-xl bg-[#2f8f75] px-4 py-3 font-bold text-white"
                        >
                          {column.action === "preparing" ? "Aceitar pedido" : "Marcar como pronto"}
                        </button>
                      )}
                      {column.title === "Prontos" && (
                        <button
                          onClick={() => setPickupOrder(order)}
                          className="mt-4 w-full rounded-xl bg-[#e85d3f] px-4 py-3 font-bold text-white"
                        >
                          Abrir retirada
                        </button>
                      )}
                    </article>
                  ))}
                  {columnOrders.length === 0 && <p className="rounded-2xl border border-dashed border-[#ddcabe] p-5 text-center text-sm text-[#947b68]">Nenhum pedido</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {!loading && (
        <div className="mt-5 rounded-3xl border border-[#f0e3d4] bg-white p-5">
          <p className="font-bold text-[#2f241d]">Retirada rápida</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={pickupCode}
              onChange={(event) => setPickupCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") findPickupOrder();
              }}
              placeholder="Digite a senha, ex.: A-042"
              className="w-full rounded-xl border border-[#eadbca] px-4 py-3 font-bold tracking-wider outline-none focus:border-[#e85d3f]"
            />
            <button
              onClick={findPickupOrder}
              className="rounded-xl bg-[#2f8f75] px-5 py-3 font-bold text-white"
            >
              Buscar retirada
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="rounded-xl border border-[#2f8f75] px-5 py-3 font-bold text-[#2f8f75]"
            >
              Escanear QR Code
            </button>
          </div>
        </div>
      )}
      {scannerOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#2f241d]/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#fffaf3] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#2f241d]">Escanear retirada</h2>
              <button onClick={() => setScannerOpen(false)} className="text-2xl text-[#765f4d]" aria-label="Fechar leitor">
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-[#765f4d]">Aponte a câmera para o QR Code mostrado pelo cliente.</p>
            <div id="production-pickup-scanner" className="mt-4 overflow-hidden rounded-2xl bg-[#2f241d]" />
            <button onClick={() => setScannerOpen(false)} className="mt-4 w-full rounded-xl border border-[#eadbca] px-4 py-3 font-bold text-[#765f4d]">
              Usar senha manualmente
            </button>
          </div>
        </div>
      )}
      {pickupOrder && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#2f241d]/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pickup-dialog-title"
            className="w-full max-w-lg rounded-3xl bg-[#fffaf3] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Retirada</p>
                <h2 id="pickup-dialog-title" className="mt-1 text-3xl font-black text-[#2f241d]">
                  {pickupOrder.pickup_code}
                </h2>
                <p className="mt-1 text-[#765f4d]">{pickupOrder.customer_name || "Cliente"}</p>
              </div>
              <button
                onClick={() => setPickupOrder(null)}
                aria-label="Fechar retirada"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#765f4d]"
              >
                ×
              </button>
            </div>
            <ul className="mt-5 space-y-2 border-t border-[#eadbca] pt-4 text-[#5e493b]">
              {pickupOrder.items.map((item, index) => (
                <li key={`${pickupOrder.id}-${index}`} className="font-semibold">
                  {item.quantity}x {item.name ?? "Produto"}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center justify-between border-t border-[#eadbca] pt-4">
              <span className="font-bold text-[#765f4d]">Total</span>
              <strong className="text-xl text-[#2f241d]">{formatPrice(pickupOrder.total_cents)}</strong>
            </p>
            <button
              onClick={() => void confirmPickup()}
              className="mt-5 w-full rounded-2xl bg-[#2f8f75] px-5 py-4 font-bold text-white"
            >
              Confirmar entrega
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
