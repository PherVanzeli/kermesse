"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { organization_name: organizationName },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (mode === "signup" && !result.data.session) {
        setMessage("Cadastro criado. Confira seu e-mail para confirmar a conta.");
      } else {
        router.push("/painel");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="organization-name" className="text-sm font-bold text-[#5e493b]">
            Nome da organização
          </label>
          <input
            id="organization-name"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            required
            placeholder="Ex.: Paróquia São José"
            className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
          />
        </div>
      )}
      <div>
        <label htmlFor="email" className="text-sm font-bold text-[#5e493b]">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-bold text-[#5e493b]">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 text-[#2f241d] outline-none focus:border-[#e85d3f]"
        />
      </div>
      {error && <p className="rounded-xl bg-[#fce4d9] p-3 text-sm text-[#b6452f]">{error}</p>}
      {message && <p className="rounded-xl bg-[#e8f5ef] p-3 text-sm text-[#2f8f75]">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[#e85d3f] px-5 py-3.5 font-bold text-white transition hover:bg-[#cf4c32] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
