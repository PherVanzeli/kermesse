import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProductPayload = {
  catalogProductId?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  description?: unknown;
  priceCents?: unknown;
  stock?: unknown;
  category?: unknown;
};

async function getAuthorizedEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, error: "Não autenticado.", status: 401 as const };

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { supabase, error: "Você não tem permissão para este evento.", status: 403 as const };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (!event) {
    return { supabase, error: "Evento não encontrado.", status: 404 as const };
  }

  return { supabase, event, status: 200 as const };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data, error } = await result.supabase
    .from("products")
    .select("id, name, description, price_cents, stock, category, active, catalog_product_id, image_url")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const { data: catalogProducts, error: catalogError } = await result.supabase
    .from("catalog_products")
    .select("id, name, description, category, suggested_price_cents, brand, size")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || catalogError) {
    return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  }

  return NextResponse.json({ products: data, catalogProducts });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let payload: ProductPayload;
  try {
    payload = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const catalogProductId =
    typeof payload.catalogProductId === "string" ? payload.catalogProductId : null;
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() || null : null;
  let name = typeof payload.name === "string" ? payload.name.trim() : "";
  let description =
    typeof payload.description === "string" ? payload.description.trim() || null : null;
  let category = typeof payload.category === "string" ? payload.category : "food";
  const priceCents =
    typeof payload.priceCents === "number" && Number.isInteger(payload.priceCents)
      ? payload.priceCents
      : -1;
  const stock =
    payload.stock === null || payload.stock === undefined
      ? null
      : typeof payload.stock === "number" && Number.isInteger(payload.stock)
        ? payload.stock
        : -1;

  if (catalogProductId) {
    const { data: catalogProduct } = await result.supabase
      .from("catalog_products")
      .select("name, description, category")
      .eq("id", catalogProductId)
      .eq("active", true)
      .maybeSingle();

    if (!catalogProduct) {
      return NextResponse.json({ error: "Produto padrão não encontrado." }, { status: 404 });
    }
    name = catalogProduct.name;
    description = catalogProduct.description;
    category = catalogProduct.category;
  }

  if (name.length < 2 || name.length > 100 || priceCents < 0 || (stock !== null && stock < 0)) {
    return NextResponse.json(
      { error: "Informe nome, preço e estoque válidos." },
      { status: 400 },
    );
  }

  const { data, error } = await result.supabase
    .from("products")
    .insert({
      event_id: id,
      catalog_product_id: catalogProductId,
      image_url: imageUrl,
      name,
      description,
      category,
      price_cents: priceCents,
      stock,
      active: true,
    })
    .select("id, name, description, price_cents, stock, category, active, catalog_product_id, image_url")
    .single();

  if (error) {
    return NextResponse.json({ error: "Não foi possível criar o produto." }, { status: 500 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let payload: { productId?: unknown; active?: unknown };
  try {
    payload = (await request.json()) as { productId?: unknown; active?: unknown };
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (typeof payload.productId !== "string" || typeof payload.active !== "boolean") {
    return NextResponse.json({ error: "Produto ou status inválido." }, { status: 400 });
  }

  const { error } = await result.supabase
    .from("products")
    .update({ active: payload.active })
    .eq("id", payload.productId)
    .eq("event_id", id);

  if (error) {
    return NextResponse.json({ error: "Não foi possível atualizar o produto." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
  }

  const { error } = await result.supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("event_id", id);

  if (error) {
    return NextResponse.json({ error: "Não foi possível excluir o produto." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
