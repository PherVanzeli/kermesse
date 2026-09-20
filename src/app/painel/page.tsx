import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
        <div className="mt-8 rounded-3xl border border-[#f0e3d4] bg-white p-6">
          <p className="text-[#765f4d]">
            Conta conectada como <strong className="text-[#2f241d]">{user.email}</strong>.
          </p>
          <p className="mt-3 text-sm text-[#947b68]">
            O cadastro do evento e dos produtos será o próximo módulo do painel.
          </p>
        </div>
      </div>
    </main>
  );
}
