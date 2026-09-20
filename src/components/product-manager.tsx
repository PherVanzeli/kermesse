"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stock: number | null;
  category: string;
  active: boolean;
};

const categories = [
  ["food", "Comida"],
  ["drink", "Bebida"],
  ["sweet", "Doce"],
  ["ticket", "Ingresso"],
];

function formatPriceInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole = "", decimals = ""] = normalized.split(".");
  return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function ProductManager({ eventId }: { eventId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("food");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/events/${eventId}/products`)
      .then(async (response) => {
        const result = (await response.json()) as { products?: Product[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar os produtos.");
        if (active) setProducts(result.products ?? []);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Não foi possível carregar os produtos.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
      const stockValue = stock.trim() === "" ? null : Number(stock);
      const response = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priceCents,
          stock: stockValue,
          category,
        }),
      });
      const result = (await response.json()) as { product?: Product; error?: string };
      if (!response.ok || !result.product) throw new Error(result.error ?? "Não foi possível criar o produto.");
      setProducts((current) => [...current, result.product as Product]);
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    const response = await fetch(`/api/events/${eventId}/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, active: !product.active }),
    });
    if (!response.ok) {
      setError("Não foi possível atualizar a disponibilidade.");
      return;
    }
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, active: !item.active } : item)),
    );
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    const response = await fetch(`/api/events/${eventId}/products?productId=${product.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Não foi possível excluir o produto.");
      return;
    }
    setProducts((current) => current.filter((item) => item.id !== product.id));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="rounded-3xl border border-[#f0e3d4] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#2f241d]">Adicionar produto</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="product-name" className="text-sm font-bold text-[#5e493b]">Nome</label>
            <input id="product-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 outline-none focus:border-[#e85d3f]" placeholder="Pastel de queijo" />
          </div>
          <div>
            <label htmlFor="product-description" className="text-sm font-bold text-[#5e493b]">Descrição</label>
            <textarea id="product-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 outline-none focus:border-[#e85d3f]" placeholder="Massa crocante e recheio cremoso" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="text-sm font-bold text-[#5e493b]">Preço (R$)</label>
              <input id="product-price" inputMode="decimal" value={price} onChange={(event) => setPrice(formatPriceInput(event.target.value))} required placeholder="8,00" className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 outline-none focus:border-[#e85d3f]" />
            </div>
            <div>
              <label htmlFor="product-stock" className="text-sm font-bold text-[#5e493b]">Estoque</label>
              <input id="product-stock" type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Ilimitado" className="mt-2 w-full rounded-2xl border border-[#eadbca] px-4 py-3 outline-none focus:border-[#e85d3f]" />
            </div>
          </div>
          <div>
            <label htmlFor="product-category" className="text-sm font-bold text-[#5e493b]">Categoria</label>
            <select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#eadbca] bg-white px-4 py-3 outline-none focus:border-[#e85d3f]">
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="mt-4 rounded-xl bg-[#fce4d9] p-3 text-sm text-[#b6452f]">{error}</p>}
        <button disabled={saving} className="mt-5 w-full rounded-2xl bg-[#e85d3f] px-5 py-3.5 font-bold text-white disabled:opacity-60">
          {saving ? "Salvando..." : "Adicionar produto"}
        </button>
      </form>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#2f241d]">Produtos cadastrados</h2>
          <span className="text-sm text-[#947b68]">{products.length} itens</span>
        </div>
        {loading ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center text-[#765f4d]">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-[#ddcabe] bg-white p-8 text-center text-[#765f4d]">Nenhum produto cadastrado.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-[#f0e3d4] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#2f241d]">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#947b68]">{product.description || "Sem descrição"}</p>
                    <p className="mt-2 font-black text-[#e85d3f]">{formatPrice(product.price_cents)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.active ? "bg-[#e8f5ef] text-[#2f8f75]" : "bg-[#f3ece6] text-[#947b68]"}`}>
                    {product.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f0e3d4] pt-3 text-sm">
                  <span className="text-[#765f4d]">{product.stock === null ? "Estoque ilimitado" : `${product.stock} em estoque`}</span>
                  <div className="flex gap-3">
                    <button onClick={() => toggleActive(product)} className="font-bold text-[#2f8f75]">{product.active ? "Desativar" : "Ativar"}</button>
                    <button onClick={() => remove(product)} className="font-bold text-[#b6452f]">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
