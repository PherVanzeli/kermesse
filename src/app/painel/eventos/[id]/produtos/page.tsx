import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/product-manager";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, status")
    .eq("id", id)
    .maybeSingle();

  if (!event) redirect("/painel");

  return (
    <main className="min-h-screen bg-[#fffaf3] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/painel" className="text-sm font-bold text-[#765f4d]">
          ← Voltar ao painel
        </Link>
        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Produtos</p>
          <h1 className="mt-2 text-3xl font-black text-[#2f241d]">{event.name}</h1>
          <p className="mt-2 text-[#765f4d]">
            Cadastre o que será vendido e controle a disponibilidade no cardápio.
          </p>
        </div>
        <div className="mt-8">
          <ProductManager eventId={event.id} />
        </div>
      </div>
    </main>
  );
}
