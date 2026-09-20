"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  emoji: string;
};

type EventData = {
  name: string;
  subtitle: string;
  location: string;
  categories: string[];
  products: Product[];
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

export function MenuClient({ event }: { event: EventData }) {
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [customerName, setCustomerName] = useState("");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "cash" | "paid">("pending");
  const [pixCopied, setPixCopied] = useState(false);

  const products = event.products.filter(
    (product) => category === "Todos" || product.category === category,
  );
  const cartItems = event.products.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const totalCents = cartItems.reduce(
    (sum, product) => sum + product.priceCents * cart[product.id],
    0,
  );

  const addProduct = (productId: string) => {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  };

  const removeProduct = (productId: string) => {
    setCart((current) => {
      const quantity = (current[productId] ?? 0) - 1;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  };

  const cartLabel = useMemo(
    () => `${itemCount} ${itemCount === 1 ? "item" : "itens"}`,
    [itemCount],
  );

  const startCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const confirmOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerName.trim()) return;
    setOrderCode(`A-${String((Date.now() % 900) + 100)}`);
    setPaymentStatus(paymentMethod === "pix" ? "pending" : "cash");
  };

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136kermesse-${orderCode ?? "pedido"}-${totalCents}5204000053039865802BR5920KERMESSE EVENTO6009SAO PAULO62070503***6304ABCD`;

  const copyPixCode = async () => {
    await navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
  };

  return (
    <main className="min-h-screen bg-[#fffaf3] pb-28">
      <header className="bg-[#2f241d] px-5 pb-8 pt-6 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-tight">Kermesse</span>
            <span className="rounded-full bg-[#2f8f75] px-3 py-1 text-xs font-bold">
              Aberto agora
            </span>
          </div>
          <p className="mt-10 text-sm font-semibold text-[#f6c453]">{event.subtitle}</p>
          <h1 className="mt-1 text-3xl font-black">{event.name}</h1>
          <p className="mt-2 text-sm text-[#ddcabe]">{event.location}</p>
        </div>
      </header>

      <div className="sticky top-0 z-10 border-b border-[#f0e3d4] bg-[#fffaf3]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto">
          {["Todos", ...event.categories].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                category === item
                  ? "bg-[#e85d3f] text-white"
                  : "bg-white text-[#765f4d] hover:text-[#e85d3f]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e85d3f]">
            Cardápio
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#2f241d]">Escolha seus favoritos</h2>
        </div>
        <div className="space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex items-center gap-4 rounded-3xl border border-[#f0e3d4] bg-white p-4 shadow-sm"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff1dc] text-3xl">
                {product.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#2f241d]">{product.name}</h3>
                <p className="mt-1 text-sm text-[#947b68]">{product.description}</p>
                <p className="mt-2 font-black text-[#e85d3f]">{formatPrice(product.priceCents)}</p>
              </div>
              <button
                onClick={() => addProduct(product.id)}
                aria-label={`Adicionar ${product.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4d9] text-xl font-bold text-[#e85d3f] transition hover:bg-[#e85d3f] hover:text-white"
              >
                +
              </button>
            </article>
          ))}
        </div>
      </section>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#eadbca] bg-[#fffaf3]/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-[#e85d3f] px-5 py-4 font-bold text-white shadow-lg shadow-[#e85d3f]/20"
            >
              <span>{cartLabel}</span>
              <span>Ver carrinho · {formatPrice(totalCents)}</span>
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#2f241d]/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-[#fffaf3] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#e85d3f]">Seu pedido</p>
                <h2 className="text-2xl font-black text-[#2f241d]">{cartLabel}</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Fechar carrinho"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#765f4d]"
              >
                ×
              </button>
            </div>
            <div className="my-6 divide-y divide-[#eadbca]">
              {cartItems.map((product) => (
                <div key={product.id} className="flex items-center gap-3 py-4">
                  <span className="text-2xl">{product.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#2f241d]">{product.name}</p>
                    <p className="text-sm text-[#947b68]">{formatPrice(product.priceCents)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="h-8 w-8 rounded-full bg-white font-bold text-[#e85d3f]"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-bold text-[#2f241d]">
                      {cart[product.id]}
                    </span>
                    <button
                      onClick={() => addProduct(product.id)}
                      className="h-8 w-8 rounded-full bg-white font-bold text-[#e85d3f]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#eadbca] pt-4">
              <span className="font-bold text-[#765f4d]">Total</span>
              <span className="text-2xl font-black text-[#2f241d]">{formatPrice(totalCents)}</span>
            </div>
            <button
              onClick={startCheckout}
              className="mt-5 w-full rounded-2xl bg-[#2f8f75] px-5 py-4 font-bold text-white transition hover:bg-[#26755f]"
            >
              Continuar para pagamento
            </button>
            <p className="mt-3 text-center text-xs text-[#947b68]">
              Pagamento via Pix ou cartão. Você receberá uma senha para retirar.
            </p>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#2f241d]/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fffaf3] p-6 shadow-2xl">
            {!orderCode ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#e85d3f]">Finalizar pedido</p>
                    <h2 className="text-2xl font-black text-[#2f241d]">Como você vai pagar?</h2>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    aria-label="Fechar pagamento"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#765f4d]"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={confirmOrder}>
                  <label className="mt-6 block text-sm font-bold text-[#5e493b]" htmlFor="customer-name">
                    Nome para a retirada
                  </label>
                  <input
                    id="customer-name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Ex.: Maria da Silva"
                    required
                    className="mt-2 w-full rounded-2xl border border-[#eadbca] bg-white px-4 py-3 text-[#2f241d] outline-none transition placeholder:text-[#b9a594] focus:border-[#e85d3f]"
                  />

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        paymentMethod === "pix"
                          ? "border-[#2f8f75] bg-[#e8f5ef]"
                          : "border-[#eadbca] bg-white"
                      }`}
                    >
                      <span className="text-2xl">▣</span>
                      <span className="mt-2 block font-bold text-[#2f241d]">Pix</span>
                      <span className="mt-1 block text-xs text-[#765f4d]">Confirmação rápida</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        paymentMethod === "card"
                          ? "border-[#2f8f75] bg-[#e8f5ef]"
                          : "border-[#eadbca] bg-white"
                      }`}
                    >
                      <span className="text-2xl">▤</span>
                      <span className="mt-2 block font-bold text-[#2f241d]">Cartão</span>
                      <span className="mt-1 block text-xs text-[#765f4d]">No balcão de pagamento</span>
                    </button>
                  </div>

                  {paymentMethod === "pix" ? (
                    <div className="mt-5 rounded-2xl bg-[#fff1dc] p-4 text-sm leading-6 text-[#765f4d]">
                      <p className="font-bold text-[#5e493b]">Pix selecionado</p>
                      <p className="mt-1">
                        No próximo passo você receberá o QR code e o código copia e cola.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-[#fff1dc] p-4 text-sm leading-6 text-[#765f4d]">
                      <p className="font-bold text-[#5e493b]">Pagamento no balcão</p>
                      <p className="mt-1">
                        Apresente sua senha no caixa e pague com cartão antes de retirar.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-[#eadbca] pt-4">
                    <span className="font-bold text-[#765f4d]">Total do pedido</span>
                    <span className="text-2xl font-black text-[#2f241d]">{formatPrice(totalCents)}</span>
                  </div>
                  <button
                    type="submit"
                    className="mt-5 w-full rounded-2xl bg-[#e85d3f] px-5 py-4 font-bold text-white shadow-lg shadow-[#e85d3f]/20 transition hover:bg-[#cf4c32]"
                  >
                    {paymentMethod === "pix" ? "Gerar Pix e confirmar" : "Confirmar pedido"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ef] text-3xl text-[#2f8f75]">
                  ✓
                </div>
                <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[#2f8f75]">
                  Pedido criado
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#2f241d]">Sua senha é</h2>
                <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-3xl bg-[#2f241d] text-4xl font-black tracking-wider text-white">
                  {orderCode}
                </div>
                {paymentMethod === "pix" && paymentStatus !== "paid" && (
                  <div className="mt-5 rounded-2xl border border-[#eadbca] bg-white p-4 text-left">
                    <p className="font-bold text-[#2f241d]">Pague com Pix para liberar o preparo</p>
                    <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-2xl border-8 border-white bg-[#2f241d] p-3 shadow-md">
                      <div className="grid h-full w-full grid-cols-5 gap-1 bg-white p-1">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span
                            key={index}
                            className={index % 3 === 0 || index % 7 === 0 ? "bg-[#2f241d]" : "bg-white"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 break-all rounded-xl bg-[#fff1dc] p-3 text-xs leading-5 text-[#765f4d]">
                      {pixCode}
                    </p>
                    <button
                      onClick={copyPixCode}
                      className="mt-3 w-full rounded-xl border border-[#2f8f75] px-4 py-3 text-sm font-bold text-[#2f8f75] transition hover:bg-[#e8f5ef]"
                    >
                      {pixCopied ? "Código Pix copiado" : "Copiar código Pix"}
                    </button>
                    <button
                      onClick={() => setPaymentStatus("paid")}
                      className="mt-3 w-full rounded-xl bg-[#2f8f75] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#26755f]"
                    >
                      Simular Pix confirmado
                    </button>
                    <p className="mt-2 text-center text-xs text-[#947b68]">
                      Esta simulação será substituída pelo webhook do gateway.
                    </p>
                  </div>
                )}
                {paymentStatus === "paid" && (
                  <div className="mt-5 rounded-2xl bg-[#e8f5ef] p-4 text-left text-[#2f8f75]">
                    <p className="font-bold">Pagamento Pix confirmado</p>
                    <p className="mt-1 text-sm">Seu pedido entrou na fila de produção.</p>
                  </div>
                )}
                {paymentStatus === "cash" && (
                  <div className="mt-5 rounded-2xl bg-[#fff1dc] p-4 text-left text-sm text-[#765f4d]">
                    <p className="font-bold text-[#5e493b]">Pagamento no caixa</p>
                    <p className="mt-1">Pague com cartão no balcão e informe a senha {orderCode}.</p>
                  </div>
                )}
                <div className="mx-auto mt-6 flex h-36 w-36 items-center justify-center rounded-2xl border-8 border-white bg-[#2f241d] p-3 shadow-md">
                  <div className="grid h-full w-full grid-cols-5 gap-1 bg-white p-1">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span
                        key={index}
                        className={index % 3 === 0 || index % 7 === 0 ? "bg-[#2f241d]" : "bg-white"}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#947b68]">Mostre este QR code na retirada</p>
                <div className="mt-6 rounded-2xl bg-[#fff1dc] p-4 text-left text-sm text-[#765f4d]">
                  <p className="font-bold text-[#5e493b]">Próximos passos</p>
                  <p className="mt-1">Acompanhe a fila e retire quando seu pedido estiver pronto.</p>
                </div>
                <button
                  onClick={() => {
                    setCheckoutOpen(false);
                    setCart({});
                  }}
                  className="mt-5 w-full rounded-2xl bg-[#2f8f75] px-5 py-4 font-bold text-white transition hover:bg-[#26755f]"
                >
                  Voltar para o cardápio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
