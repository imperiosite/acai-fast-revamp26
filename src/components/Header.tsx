import { useEffect, useState } from "react";
import { Star, Clock, MapPin, ShoppingBag, ChevronDown } from "lucide-react";
import { useCart, formatBRL } from "@/store/cart";
import { STORE } from "@/data/menu";
import { getStoreStatus, WEEK_HOURS } from "@/lib/hours";
import logo from "@/assets/logo.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const count = useCart((s) => s.count());
  const subtotal = useCart((s) => s.subtotal());
  const setOpen = useCart((s) => s.setOpen);

  const [status, setStatus] = useState(getStoreStatus());
  useEffect(() => {
    const id = setInterval(() => setStatus(getStoreStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <section className="relative bg-gradient-hero border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-8 md:pt-14 md:pb-12">
          {/* Logo central */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-gradient-gold blur-2xl opacity-20 rounded-full" />
              <img
                src={logo}
                alt={STORE.name}
                className="relative h-24 w-24 md:h-28 md:w-28 rounded-full object-cover bg-card p-2 shadow-elevated border border-gold/30"
              />
            </div>

            <p className="text-[0.65rem] md:text-xs uppercase tracking-[0.4em] text-gold mb-2">
              Cardápio Digital
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-medium leading-tight">
              {STORE.name}
            </h1>
            <div className="divider-gold w-32 mt-3 mb-3">
              <span className="text-gold text-xs">✦</span>
            </div>
            <p className="text-muted-foreground text-sm md:text-base italic font-light max-w-md">
              {STORE.tagline}
            </p>

            {/* Status + horário */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-smooth ${
                      status.isOpen
                        ? "bg-success/10 border-success/40 text-foreground"
                        : "bg-destructive/10 border-destructive/40 text-foreground"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status.isOpen ? "bg-success animate-pulse" : "bg-destructive"
                      }`}
                    />
                    <span className="font-semibold">{status.label}</span>
                    <span className="text-muted-foreground hidden sm:inline">· {status.nextChange}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-card border-border/60">
                  <h4 className="text-sm font-semibold mb-2 text-gold">Horário de funcionamento</h4>
                  <ul className="space-y-1 text-xs">
                    {WEEK_HOURS.map((d) => (
                      <li key={d.day} className="flex justify-between text-muted-foreground">
                        <span>{d.day}</span>
                        <span className="text-foreground">{d.hours}</span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                <span className="font-semibold">{STORE.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <Clock className="h-3.5 w-3.5 text-gold" />
                <span>14:00 – 01:30</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <MapPin className="h-3.5 w-3.5 text-gold" />
                <span>Entrega {formatBRL(STORE.deliveryFee)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <span className="text-muted-foreground">Mín.</span>
                <span className="font-semibold">{formatBRL(STORE.minOrder)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating cart mobile */}
      {count > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-gradient-gold text-accent-foreground rounded-xl p-3.5 shadow-elevated flex items-center justify-between font-semibold"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Ver carrinho · {count} {count === 1 ? "item" : "itens"}
          </span>
          <span>{formatBRL(subtotal)}</span>
        </button>
      )}

      {/* Desktop cart */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed top-12 right-4 z-40 items-center gap-2 bg-card/90 backdrop-blur border border-border/60 hover:border-gold/50 transition-smooth px-4 py-2.5 rounded-full shadow-soft"
      >
        <ShoppingBag className="h-4 w-4 text-gold" />
        <span className="font-semibold text-sm">{count}</span>
        {count > 0 && <span className="text-sm text-muted-foreground">· {formatBRL(subtotal)}</span>}
      </button>
    </>
  );
}
