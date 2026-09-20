import { notFound } from "next/navigation";
import { MenuClient } from "./menu-client";

const demoEvent = {
  slug: "arraia-sao-jose",
  name: "Arraiá da São José",
  subtitle: "Festa Junina",
  location: "Paróquia São José · Hoje, até 22h",
  categories: ["Todos", "Comidas", "Bebidas", "Doces"],
  products: [
    {
      id: "pastel-queijo",
      name: "Pastel de queijo",
      description: "Massa crocante, recheio cremoso",
      priceCents: 800,
      category: "Comidas",
      emoji: "🥟",
    },
    {
      id: "caldinho-feijao",
      name: "Caldinho de feijão",
      description: "Quentinho, com cheiro-verde",
      priceCents: 700,
      category: "Comidas",
      emoji: "🍲",
    },
    {
      id: "milho-cozido",
      name: "Milho cozido",
      description: "Com manteiga e sal",
      priceCents: 600,
      category: "Comidas",
      emoji: "🌽",
    },
    {
      id: "quentao",
      name: "Quentão sem álcool",
      description: "Receita tradicional da casa",
      priceCents: 600,
      category: "Bebidas",
      emoji: "🍵",
    },
    {
      id: "suco-uva",
      name: "Suco de uva",
      description: "Copo de 300 ml",
      priceCents: 500,
      category: "Bebidas",
      emoji: "🧃",
    },
    {
      id: "canjica",
      name: "Canjica cremosa",
      description: "Com canela por cima",
      priceCents: 700,
      category: "Doces",
      emoji: "🍮",
    },
  ],
};

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== demoEvent.slug) {
    notFound();
  }

  return <MenuClient event={demoEvent} />;
}
