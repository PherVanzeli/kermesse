import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuClient } from "./menu-client";

function formatLocation(location: string | null, eventDate: string) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${eventDate}T12:00:00`));

  return [location, date].filter(Boolean).join(" · ");
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, starts_at, location, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!event) notFound();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price_cents, category, stock, image_url")
    .eq("event_id", event.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o cardápio.");
  }

  const categories = Array.from(
    new Set((products ?? []).map((product) => product.category)),
  );

  return (
    <MenuClient
      event={{
        id: event.id,
        name: event.name,
        subtitle: "Cardápio do evento",
        location: formatLocation(event.location, event.event_date),
        categories,
        products: (products ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? "Produto da festa",
          priceCents: product.price_cents,
          category: product.category,
          emoji: categoryEmoji(product.category),
          imageUrl: product.image_url,
        })),
      }}
    />
  );
}

function categoryEmoji(category: string) {
  switch (category) {
    case "drink":
      return "🧃";
    case "sweet":
      return "🍮";
    case "ticket":
      return "🎟️";
    default:
      return "🍽️";
  }
}
