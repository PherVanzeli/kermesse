import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventStatusControl } from "@/components/event-status-control";
import { EventQrCode } from "@/components/event-qr-code";
import { PaymentSettings } from "@/components/payment-settings";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const { data: events } = membership
    ? await supabase
        .from("events")
        .select("id, name, event_date, status, slug")
        .eq("tenant_id", membership.tenant_id)
        .order("event_date", { ascending: true })
    : { data: [] };

  return (
    <main className="min-h-screen bg-[#fffaf3] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Painel</p>
            <h1 className="mt-1 text-3xl font-black text-[#2f241d]">Sua operação começa aqui</h1>
          </div>
          <Link href="/" className="text-sm font-bold text-[#765f4d]">Voltar ao site</Link>
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-[#f0e3d4] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#765f4d]">
            Conta conectada como <strong className="text-[#2f241d]">{user.email}</strong>.
          </p>
          <Link href="/painel/eventos/novo" className="rounded-full bg-[#e85d3f] px-5 py-3 text-center font-bold text-white">
            Criar evento
          </Link>
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#2f241d]">Seus eventos</h2>
            <span className="text-sm text-[#947b68]">{events?.length ?? 0} cadastrados</span>
          </div>
          {events && events.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-[#f0e3d4] bg-white p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#2f241d]">{event.name}</h3>
                      <p className="mt-1 text-sm text-[#947b68]">{event.event_date} · {event.status}</p>
                      <EventQrCode slug={event.slug} active={event.status === "active"} />
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-start gap-4 lg:justify-end">
                      <EventStatusControl eventId={event.id} status={event.status} />
                      <Link href={`/painel/eventos/${event.id}/produtos`} className="text-sm font-bold text-[#2f8f75]">
                        Produtos
                      </Link>
                      <Link href={`/painel/eventos/${event.id}/producao`} className="text-sm font-bold text-[#2f8f75]">
                        Produção
                      </Link>
                      <Link href={`/painel/eventos/${event.id}/retirada`} className="text-sm font-bold text-[#2f8f75]">
                        Retirada
                      </Link>
                      <Link href={`/evento/${event.slug}`} className="text-sm font-bold text-[#e85d3f]">
                        Cardápio
                      </Link>
                    </div>
                  </div>
                  <div className="mt-5">
                    <PaymentSettings eventId={event.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-[#ddcabe] bg-white p-8 text-center">
              <p className="font-bold text-[#2f241d]">Você ainda não criou um evento.</p>
              <p className="mt-2 text-sm text-[#947b68]">Comece cadastrando a data e o local da sua festa.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
