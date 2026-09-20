"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EventStatusControl({
  eventId,
  status,
}: {
  eventId: string;
  status: "draft" | "active" | "closed";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateStatus = async (nextStatus: "draft" | "active" | "closed") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar o evento.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {status === "draft" && (
        <button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="rounded-full bg-[#2f8f75] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Publicando..." : "Publicar"}
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => updateStatus("closed")}
          disabled={loading}
          className="rounded-full border border-[#eadbca] px-4 py-2 text-sm font-bold text-[#b6452f] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Encerrar"}
        </button>
      )}
      {status === "closed" && (
        <button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="rounded-full border border-[#eadbca] px-4 py-2 text-sm font-bold text-[#2f8f75] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Reabrir"}
        </button>
      )}
      {error && <span className="max-w-48 text-right text-xs text-[#b6452f]">{error}</span>}
    </div>
  );
}
