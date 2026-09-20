const features = [
  {
    title: "Cardápio por QR code",
    description: "Seu público compra do próprio celular, sem instalar aplicativo.",
    icon: "▦",
  },
  {
    title: "Produção organizada",
    description: "A cozinha recebe pedidos em tempo real e trabalha por senha.",
    icon: "✓",
  },
  {
    title: "Retirada expressa",
    description: "Valide a senha ou o QR code e entregue em poucos segundos.",
    icon: "→",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf3]">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e85d3f] text-xl font-black text-white">
            K
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2f241d]">Kermesse</span>
        </div>
        <a
          href="#como-funciona"
          className="hidden rounded-full border border-[#eadbca] px-5 py-2.5 text-sm font-semibold text-[#6f5746] transition hover:border-[#e85d3f] hover:text-[#e85d3f] sm:block"
        >
          Como funciona
        </a>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#fce4d9] px-4 py-2 text-sm font-semibold text-[#b6452f]">
            <span className="h-2 w-2 rounded-full bg-[#e85d3f]" />
            Feito para festas que juntam pessoas
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-[#2f241d] sm:text-6xl">
            A fila da quermesse acabou.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#765f4d]">
            Cardápio, Pix e retirada por senha em um só lugar. Mais tempo celebrando,
            menos tempo esperando.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#comece"
              className="rounded-full bg-[#e85d3f] px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-[#e85d3f]/20 transition hover:bg-[#cf4c32]"
            >
              Criar meu evento
            </a>
            <a
              href="#como-funciona"
              className="rounded-full border border-[#eadbca] px-6 py-3.5 text-center font-bold text-[#6f5746] transition hover:border-[#e85d3f] hover:text-[#e85d3f]"
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="relative rounded-[2rem] bg-[#f6c453] p-6 shadow-2xl shadow-[#d7a839]/20 sm:p-10">
          <div className="absolute -right-3 -top-4 rounded-full bg-[#2f8f75] px-4 py-2 text-sm font-bold text-white shadow-lg">
            Pedido #A-042
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[#f1e8dc] pb-5">
              <div>
                <p className="text-sm font-semibold text-[#a1846e]">Festa Junina</p>
                <h2 className="mt-1 text-2xl font-black text-[#2f241d]">Arraiá da São José</h2>
              </div>
              <span className="rounded-full bg-[#e8f5ef] px-3 py-1.5 text-xs font-bold text-[#2f8f75]">
                Aberto
              </span>
            </div>
            <div className="space-y-4 py-5">
              {[
                ["Pastel de queijo", "R$ 8,00"],
                ["Caldinho de feijão", "R$ 7,00"],
                ["Quentão sem álcool", "R$ 6,00"],
              ].map(([item, price]) => (
                <div key={item} className="flex items-center justify-between">
                  <span className="font-semibold text-[#5e493b]">{item}</span>
                  <span className="font-bold text-[#2f241d]">{price}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#fff5e8] p-4">
              <span className="font-bold text-[#765f4d]">Total</span>
              <span className="text-xl font-black text-[#e85d3f]">R$ 21,00</span>
            </div>
            <div className="mt-4 rounded-2xl bg-[#2f8f75] px-4 py-3 text-center font-bold text-white">
              Pagamento confirmado · Retire no balcão
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-[#f0e3d4] bg-white/60">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-3 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl p-5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fce4d9] text-xl font-black text-[#e85d3f]">
                {feature.icon}
              </div>
              <h2 className="text-xl font-black text-[#2f241d]">{feature.title}</h2>
              <p className="mt-2 leading-7 text-[#765f4d]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="comece" className="mx-auto max-w-6xl px-6 py-16 text-center lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e85d3f]">Primeiro passo</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight text-[#2f241d] sm:text-4xl">
          Organize sua próxima festa sem complicação.
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-[#765f4d]">
          O painel do produtor, o cardápio do cliente e a operação da barraca em uma experiência simples.
        </p>
        <button className="mt-8 rounded-full bg-[#2f241d] px-7 py-3.5 font-bold text-white transition hover:bg-[#4b392d]">
          Em breve: acessar o painel
        </button>
      </section>
    </main>
  );
}
