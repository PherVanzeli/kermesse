"use client";

import { useEffect, useState } from "react";

type Account = {
  id: string;
  provider: string;
  environment: string;
  account_reference: string | null;
  secret_last_four: string | null;
  active: boolean;
};

const providerLabels: Record<string, string> = {
  asaas: "Asaas",
  mercado_pago: "Mercado Pago",
  pagseguro: "PagSeguro",
};

export function PaymentSettings({ eventId }: { eventId?: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [provider, setProvider] = useState("asaas");
  const [environment, setEnvironment] = useState("sandbox");
  const [apiKey, setApiKey] = useState("");
  const [reference, setReference] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAccounts = async () => {
    const response = await fetch("/api/payment-accounts");
    const result = (await response.json()) as { accounts?: Account[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar os gateways.");
    setAccounts(result.accounts ?? []);
  };

  useEffect(() => {
    let mounted = true;
    void fetch("/api/payment-accounts")
      .then(async (response) => {
        const result = (await response.json()) as { accounts?: Account[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar os gateways.");
        if (mounted) setAccounts(result.accounts ?? []);
      })
      .catch((error: unknown) => {
        if (mounted) setMessage(error instanceof Error ? error.message : "Erro ao carregar gateways.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saveAccount = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/payment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, environment, apiKey, accountReference: reference }),
      });
      const result = (await response.json()) as { account?: Account; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar.");
      setApiKey("");
      await loadAccounts();
      setMessage("Gateway salvo com segurança.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const assignAccount = async () => {
    if (!eventId || !selectedAccount) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/events/${eventId}/payment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAccountId: selectedAccount }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível associar.");
      setMessage("Gateway associado ao evento.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível associar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[#f0e3d4] bg-white p-6">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e85d3f]">Pagamentos</p>
      <h2 className="mt-1 text-2xl font-black text-[#2f241d]">Gateways do organizador</h2>
      <p className="mt-2 text-sm text-[#765f4d]">
        A credencial é criptografada no servidor e nunca é exibida novamente.
      </p>
      <form onSubmit={saveAccount} className="mt-5 grid gap-3 sm:grid-cols-2">
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="rounded-xl border p-3">
          {Object.entries(providerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={environment} onChange={(event) => setEnvironment(event.target.value)} className="rounded-xl border p-3">
          <option value="sandbox">Sandbox</option>
          <option value="production">Produção</option>
        </select>
        <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Identificação da conta (opcional)" className="rounded-xl border p-3 sm:col-span-2" />
        <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API Key" type="password" required className="rounded-xl border p-3 sm:col-span-2" />
        <button disabled={saving} className="rounded-xl bg-[#2f8f75] p-3 font-bold text-white disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar gateway"}
        </button>
      </form>
      {accounts.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-[#2f241d]">Contas cadastradas</h3>
          {accounts.map((account) => (
            <label key={account.id} className="flex cursor-pointer items-center justify-between rounded-2xl border p-4">
              <span>
                <strong>{providerLabels[account.provider]}</strong>
                <span className="ml-2 text-sm text-[#765f4d]">{account.environment} · ****{account.secret_last_four}</span>
              </span>
              {eventId && <input type="radio" name="gateway" value={account.id} checked={selectedAccount === account.id} onChange={() => setSelectedAccount(account.id)} />}
            </label>
          ))}
          {eventId && <button type="button" onClick={assignAccount} disabled={!selectedAccount || saving} className="rounded-xl bg-[#e85d3f] px-4 py-3 font-bold text-white disabled:opacity-50">Associar ao evento</button>}
        </div>
      )}
      {message && <p className="mt-4 text-sm font-bold text-[#2f241d]">{message}</p>}
    </section>
  );
}
