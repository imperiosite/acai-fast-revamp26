const PROMOS = [
  { emoji: "🎉", text: "Frete grátis acima de R$ 40 · Use o cupom", code: "FRETE0" },
  { emoji: "🍇", text: "10% de desconto no primeiro pedido · Use o cupom", code: "BEMVINDO10" },
  { emoji: "⚡", text: "15% OFF em toda a loja hoje · Use o cupom", code: "ACAI15" },
];

import { useState, useEffect } from "react";
import { Tag } from "lucide-react";

export function DemoBanner() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PROMOS.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const promo = PROMOS[idx];

  return (
    <div className="bg-gradient-gold text-accent-foreground text-center py-2 px-4 text-xs font-semibold">
      <div className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
        <span>{promo.emoji}</span>
        <span>{promo.text}</span>
        <span className="flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full font-mono tracking-wider">
          <Tag className="h-3 w-3" />
          {promo.code}
        </span>
      </div>
    </div>
  );
}
