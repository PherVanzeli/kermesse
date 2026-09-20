"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function EventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("terracotta");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, eventDate, startsAt, location, theme }),
      });
      const result = (await response.json()) as { error?: string; event?: { slug: string } };
      if (!response.ok || !result.event) {
        throw new Error(result.error ?? "Não foi possível criar o evento.");
      }
      router.push(`/painel?created=${encodeURIComponent(result.event.slug)}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar o evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="event-name" className="text-sm font-bold text-[#5e493b]">Nome do evento</label>
        <input
          id="event-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Festa Junina da São José"
          required
          minLength={3}
          maxLength={100}
          className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="event-date" className="text-sm font-bold text-[#5e493b]">Data</label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
          />
        </div>
        <div>
          <label htmlFor="event-time" className="text-sm font-bold text-[#5e493b]">Horário de início</label>
          <input
            id="event-time"
            type="time"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="event-location" className="text-sm font-bold text-[#5e493b]">Local</label>
        <input
          id="event-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Ex.: Salão paroquial"
          className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
        />
      </div>
      <div>
        <span className="text-sm font-bold text-[#5e493b]">Tema visual</span>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {[
            ["terracotta", "Terracota", "bg-[#e85d3f]"],
            ["green", "Verde", "bg-[#2f8f75]"],
            ["yellow", "Amarelo", "bg-[#f6c453]"],
          ].map(([value, label, color]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`rounded-2xl border p-3 text-left ${
                theme === value ? "border-[#2f241d] ring-2 ring-[#2f241d]/10" : "border-[#eadbca]"
              }`}
            >
              <span className={`block h-5 w-5 rounded-full ${color}`} />
              <span className="mt-2 block text-sm font-bold text-[#5e493b]">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="rounded-xl bg-[#fce4d9] p-3 text-sm text-[#b6452f]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[#e85d3f] px-5 py-4 font-bold text-white transition hover:bg-[#cf4c32] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Criando evento..." : "Criar evento"}
      </button>
    </form>
  );
}
