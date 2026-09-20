import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type EventPayload = {
  name?: unknown;
  eventDate?: unknown;
  startsAt?: unknown;
  location?: unknown;
  theme?: unknown;
};

function createSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let payload: EventPayload;
  try {
    payload = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const eventDate = typeof payload.eventDate === "string" ? payload.eventDate : "";
  const location = typeof payload.location === "string" ? payload.location.trim() : null;
  const startsAt = typeof payload.startsAt === "string" ? payload.startsAt : null;
  const theme = typeof payload.theme === "string" ? payload.theme : "terracotta";

  if (name.length < 3 || name.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return NextResponse.json(
      { error: "Informe um nome válido e uma data válida para o evento." },
      { status: 400 },
    );
  }

  const slug = createSlug(name);
  if (!slug) {
    return NextResponse.json({ error: "Não foi possível gerar o link do evento." }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "Organização do usuário não encontrada." },
      { status: 403 },
    );
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      tenant_id: membership.tenant_id,
      name,
      slug,
      event_date: eventDate,
      starts_at: startsAt ? `${eventDate}T${startsAt}:00` : null,
      location,
      theme,
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Já existe um evento com esse nome ou link. Escolha outro nome." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Não foi possível criar o evento." }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
