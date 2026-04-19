import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/menu";
import { formatBRL } from "@/store/cart";
import { ItemModal } from "@/components/ItemModal";
import type { MenuItem } from "@/data/menu";

export function Menu() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(categories[0].id);
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const filtered = categories.map((c) => ({
    ...c,
    items: query.trim()
      ? c.items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
      : c.items,
  }));

  return (
    <section className="max-w-3xl mx-auto px-3 sm:px-4 pb-32">
      {/* Sticky search + category nav */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-3 pb-2 bg-background/90 backdrop-blur-lg border-b border-border/40">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar no cardápio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 bg-card/60 border-border/50 focus-visible:ring-gold/40 rounded-full text-sm"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map((c) => {
            const active = activeCat === c.id;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
                  active
                    ? "bg-gradient-gold text-accent-foreground border-transparent shadow-gold"
                    : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/40 hover:bg-card/80"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.title}</span>
              </a>
            );
          })}
        </div>
      </div>

      {filtered.map((cat) => (
        <div key={cat.id} id={`cat-${cat.id}`} className="pt-8 scroll-mt-32">
          {/* Category heading */}
          <div className="text-center mb-5">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold mb-1">{cat.emoji} Categoria</p>
            <h2 className="text-2xl sm:text-3xl font-display font-medium">{cat.title}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-8 bg-gold/30 rounded" />
              <span className="text-gold text-xs">✦</span>
              <div className="h-px w-8 bg-gold/30 rounded" />
            </div>
          </div>

          {cat.items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum item encontrado.</p>
          ) : (
            <div className="space-y-2.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="group w-full text-left bg-gradient-card rounded-xl overflow-hidden border border-border/40 hover:border-gold/50 shadow-card hover:shadow-elevated transition-all duration-200 flex gap-3 p-3 active:scale-[0.99]"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {item.badge && (
                      <Badge className="absolute top-1 left-1 bg-gradient-gold border-0 text-accent-foreground text-[0.55rem] px-1.5 py-0 font-bold leading-4">
                        {item.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-medium leading-snug">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm sm:text-base font-display font-semibold text-gold">{formatBRL(item.price)}</span>

                      {/* Pedir button — highlighted on hover */}
                      <span className="flex items-center gap-1 text-[0.7rem] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold border border-gold/40 text-gold bg-gold/5 group-hover:bg-gradient-gold group-hover:text-accent-foreground group-hover:border-transparent group-hover:shadow-gold transition-all duration-200">
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">Pedir</span>
                        <span className="sm:hidden">+</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <ItemModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
