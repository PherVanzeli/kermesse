import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let payload: { status?: unknown };
  try {
    payload = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!["draft", "active", "closed"].includes(String(payload.status))) {
    return NextResponse.json({ error: "Status de evento inválido." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Você não tem permissão para alterar eventos." }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("events")
    .update({ status: payload.status })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Não foi possível atualizar o evento." }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
