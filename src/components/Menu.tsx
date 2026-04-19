import { useMemo, useState } from "react";
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.map((c) => ({
      ...c,
      items: q ? c.items.filter((i) => i.name.toLowerCase().includes(q)) : c.items,
    }));
  }, [query]);

  return (
    <section className="max-w-3xl mx-auto px-4 pb-32">
      {/* Sticky search + nav */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-4 pb-3 bg-background/85 backdrop-blur-lg border-b border-border/40">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no cardápio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 bg-card/60 border-border/50 focus-visible:ring-gold/40 rounded-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((c) => {
            const active = activeCat === c.id;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-smooth border ${
                  active
                    ? "bg-gradient-gold text-accent-foreground border-transparent shadow-gold"
                    : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/40"
                }`}
              >
                {c.title}
              </a>
            );
          })}
        </div>
      </div>

      {filtered.map((cat) => (
        <div key={cat.id} id={`cat-${cat.id}`} className="pt-10 scroll-mt-32">
          <div className="text-center mb-6">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold mb-2">
              {cat.emoji} Categoria
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium">
              {cat.title}
            </h2>
            <div className="divider-gold w-24 mx-auto mt-3">
              <span className="text-gold text-xs">✦</span>
            </div>
          </div>

          {cat.items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">Nenhum item encontrado.</p>
          ) : (
            <div className="space-y-3">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="group w-full text-left bg-gradient-card rounded-xl overflow-hidden border border-border/50 hover:border-gold/40 shadow-card hover:shadow-elevated transition-smooth flex gap-4 p-3"
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-bounce"
                    />
                    {item.badge && (
                      <Badge className="absolute top-1.5 left-1.5 bg-gradient-gold border-0 text-accent-foreground text-[0.6rem] px-1.5 py-0 font-semibold">
                        {item.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-medium leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base sm:text-lg font-display font-medium text-gold">
                        {formatBRL(item.price)}
                      </span>
                      <span className="flex items-center gap-1 text-[0.7rem] uppercase tracking-wider px-3 py-1.5 rounded-full border border-gold/40 text-gold group-hover:bg-gradient-gold group-hover:text-accent-foreground group-hover:border-transparent transition-smooth font-semibold">
                        <Plus className="h-3 w-3" />
                        Pedir
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
