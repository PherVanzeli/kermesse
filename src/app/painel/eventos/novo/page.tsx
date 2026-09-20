import Link from "next/link";
import { EventForm } from "@/components/event-form";

export default function NewEventPage() {
  return (
    <main className="min-h-screen bg-[#fffaf3] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/painel" className="text-sm font-bold text-[#765f4d]">
          ← Voltar ao painel
        </Link>
        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Novo evento</p>
          <h1 className="mt-2 text-3xl font-black text-[#2f241d]">Crie a sua próxima festa</h1>
          <p className="mt-2 text-[#765f4d]">
            Comece com as informações principais. Você poderá adicionar produtos depois.
          </p>
        </div>
        <div className="mt-8 rounded-3xl border border-[#f0e3d4] bg-white p-6 shadow-sm sm:p-8">
          <EventForm />
        </div>
      </div>
    </main>
  );
}
