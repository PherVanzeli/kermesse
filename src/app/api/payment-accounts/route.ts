import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptPaymentCredential, getSecretLastFour } from "@/lib/payments/credentials";
import type { PaymentEnvironment, PaymentProvider } from "@/lib/payments/types";

const providers: PaymentProvider[] = ["asaas", "mercado_pago", "pagseguro"];
const environments: PaymentEnvironment[] = ["sandbox", "production"];

async function getAdminTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();
  return data;
}

export async function GET() {
  const supabase = await createClient();
  const membership = await getAdminTenant(supabase);
  if (!membership) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data, error } = await supabase
    .from("payment_accounts")
    .select("id, provider, environment, account_reference, secret_last_four, active, last_tested_at")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar os gateways." }, { status: 500 });
  return NextResponse.json({ accounts: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const membership = await getAdminTenant(supabase);
  if (!membership) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let payload: { provider?: unknown; environment?: unknown; apiKey?: unknown; accountReference?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (
    !providers.includes(String(payload.provider) as PaymentProvider) ||
    !environments.includes(String(payload.environment) as PaymentEnvironment) ||
    typeof payload.apiKey !== "string" ||
    payload.apiKey.trim().length < 8
  ) {
    return NextResponse.json({ error: "Informe provedor, ambiente e uma credencial válida." }, { status: 400 });
  }

  let encrypted: string;
  try {
    encrypted = encryptPaymentCredential(payload.apiKey.trim());
  } catch (error) {
    console.error("payment credential encryption failed", error);
    return NextResponse.json({ error: "A criptografia das credenciais não está configurada no servidor." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("payment_accounts")
    .upsert({
      tenant_id: membership.tenant_id,
      provider: payload.provider,
      environment: payload.environment,
      account_reference: typeof payload.accountReference === "string" ? payload.accountReference.trim() || null : null,
      credentials_ciphertext: encrypted,
      secret_last_four: getSecretLastFour(payload.apiKey.trim()),
      active: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,provider,environment" })
    .select("id, provider, environment, account_reference, secret_last_four, active, last_tested_at")
    .single();
  if (error) {
    console.error("payment account save failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Não foi possível salvar o gateway." }, { status: 500 });
  }
  return NextResponse.json({ account: data }, { status: 201 });
}
