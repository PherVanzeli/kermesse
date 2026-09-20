"use client";

import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  customer_name: string | null;
  pickup_code: string;
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
                    </article>
                  ))}
                  {columnOrders.length === 0 && <p className="rounded-2xl border border-dashed border-[#ddcabe] p-5 text-center text-sm text-[#947b68]">Nenhum pedido</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
