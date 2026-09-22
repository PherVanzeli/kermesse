import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptPaymentCredential } from "@/lib/payments/credentials";
import { AsaasGateway } from "@/lib/payments/asaas-gateway";
import type { PaymentEnvironment } from "@/lib/payments/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("payment_accounts")
    .select("id, tenant_id, provider, environment, credentials_ciphertext")
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  if (error || !account) return NextResponse.json({ error: "Conta de gateway não encontrada." }, { status: 404 });
  if (account.provider !== "asaas" || !account.credentials_ciphertext) {
    return NextResponse.json({ error: "Esta conta ainda não possui teste disponível." }, { status: 400 });
  }

  try {
    const gateway = new AsaasGateway(
      decryptPaymentCredential(account.credentials_ciphertext),
      account.environment as PaymentEnvironment,
    );
    await gateway.testConnection();
    await admin.from("payment_accounts").update({ active: true, last_tested_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true, message: "Conexão com o Asaas validada." });
  } catch (caught) {
    console.error("asaas connection test failed", caught);
    await admin.from("payment_accounts").update({ active: false, last_tested_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ error: "Não foi possível validar a conexão com o Asaas." }, { status: 502 });
  }
}
