import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 text-xl font-black text-[#2f241d]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e85d3f] text-white">
            K
          </span>
          Kermesse
        </Link>
        <div className="mt-8 rounded-3xl border border-[#f0e3d4] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Organizador</p>
          <h1 className="mt-2 text-3xl font-black text-[#2f241d]">Entrar no painel</h1>
          <p className="mt-2 text-[#765f4d]">Gerencie seus eventos, produtos e pagamentos.</p>
          <AuthForm mode="login" />
          <p className="mt-6 text-center text-sm text-[#765f4d]">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro" className="font-bold text-[#e85d3f]">
              Criar cadastro
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
