import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const membership = await getAdminTenant(supabase);
  if (!membership) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let payload: { paymentAccountId?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (typeof payload.paymentAccountId !== "string") {
    return NextResponse.json({ error: "Conta de gateway inválida." }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const { data: account } = await supabase
    .from("payment_accounts")
    .select("id")
    .eq("id", payload.paymentAccountId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "Conta de gateway não encontrada." }, { status: 404 });

  const { data: existingSetting, error: existingSettingError } = await supabase
    .from("event_payment_settings")
    .select("event_id, tenant_id, payment_account_id, enabled")
    .eq("event_id", id)
    .maybeSingle();
  if (existingSettingError) {
    console.error("event payment gateway association lookup failed", existingSettingError);
    return NextResponse.json({ error: "Não foi possível verificar o gateway atual." }, { status: 500 });
  }

  if (existingSetting?.payment_account_id === payload.paymentAccountId) {
    const { data, error } = await supabase
      .from("event_payment_settings")
      .update({ enabled: true, updated_at: new Date().toISOString() })
      .eq("event_id", id)
      .select("event_id, payment_account_id, enabled")
      .single();
    if (error) {
      console.error("event payment gateway association update failed", error);
      return NextResponse.json({ error: "Não foi possível ativar o gateway do evento." }, { status: 500 });
    }
    return NextResponse.json({ setting: data });
  }

  if (existingSetting && existingSetting.payment_account_id !== payload.paymentAccountId) {
    const { error: deleteError } = await supabase
      .from("event_payment_settings")
      .delete()
      .eq("event_id", id)
      .eq("tenant_id", membership.tenant_id);
    if (deleteError) {
      console.error("event payment gateway association replacement failed", deleteError);
      return NextResponse.json({ error: "Não foi possível substituir o gateway do evento." }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("event_payment_settings")
    .insert({
      event_id: id,
      tenant_id: membership.tenant_id,
      payment_account_id: payload.paymentAccountId,
      enabled: true,
      updated_at: new Date().toISOString(),
    })
    .select("event_id, payment_account_id, enabled")
    .single();
  if (error) {
    console.error("event payment gateway association failed", {
      eventId: id,
      paymentAccountId: payload.paymentAccountId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "production"
          ? "Não foi possível associar o gateway. Consulte os logs da Vercel."
          : `Não foi possível associar o gateway: ${error.message}`,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ setting: data });
}
