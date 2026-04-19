import heroAcai from "@/assets/hero-acai.jpg";
import { useCart } from "@/store/cart";

export function HeroBanner() {
  const setOpen = useCart((s) => s.setOpen);

  return (
    <section className="relative overflow-hidden mx-4 my-6 rounded-2xl shadow-elevated">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroAcai}
          alt="Açaí premium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative px-8 py-10 max-w-sm">
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-gold mb-3 font-semibold">
          🍓 Cardápio Digital
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-medium leading-tight mb-2">
          Monte seu açaí<br />
          <span className="text-gradient-gold">do seu jeito</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Frutas frescas, complementos especiais e o melhor açaí da cidade direto pra você. 🍫
        </p>
        <button
          onClick={() => {
            const el = document.getElementById("cat-copos");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-2 bg-gradient-gold text-accent-foreground font-bold px-6 py-3 rounded-full shadow-gold hover:opacity-90 transition-smooth text-sm"
        >
          🍧 Fazer pedido
        </button>
      </div>
    </section>
  );
}
