import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductionBoard } from "@/components/production-board";

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!event) redirect("/painel");

  return (
    <main className="min-h-screen bg-[#fffaf3] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/painel" className="text-sm font-bold text-[#765f4d]">← Voltar ao painel</Link>
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Produção</p>
            <h1 className="mt-2 text-3xl font-black text-[#2f241d]">{event.name}</h1>
            <p className="mt-2 text-[#765f4d]">Atualização automática a cada 5 segundos.</p>
          </div>
          <Link href={`/painel/eventos/${id}/produtos`} className="text-sm font-bold text-[#2f8f75]">Gerenciar produtos</Link>
        </div>
        <div className="mt-8"><ProductionBoard eventId={event.id} /></div>
      </div>
    </main>
  );
}
