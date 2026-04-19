import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, formatBRL } from "@/store/cart";
import { STORE, categories } from "@/data/menu";
import { CheckoutModal } from "@/components/CheckoutModal";

const findAddOnName = (groupId: string, addOnId: string) => {
  for (const cat of categories) {
    for (const item of cat.items) {
      const g = item.groups.find((gr) => gr.id === groupId);
      if (g) {
        const a = g.items.find((x) => x.id === addOnId);
        if (a) return a.name;
      }
    }
  }
  return addOnId;
};

export function CartDrawer() {
  const { open, setOpen, lines, updateQty, removeLine, subtotal, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const sub = subtotal();
  const minOk = sub >= STORE.minOrder;

  const handleCheckout = () => setCheckoutOpen(true);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border/60 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Seu carrinho
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="h-20 w-20 rounded-full bg-gradient-primary/20 flex items-center justify-center animate-float">
              <ShoppingBag className="h-10 w-10 text-accent" />
            </div>
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <p className="text-xs text-muted-foreground">Escolha seu açaí e adicione itens 💜</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {lines.map((l) => (
                <div key={l.lineId} className="bg-secondary/40 rounded-xl p-3 flex gap-3">
                  <img
                    src={l.item.image}
                    alt={l.item.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{l.item.name}</h4>
                      <button
                        onClick={() => removeLine(l.lineId)}
                        className="text-muted-foreground hover:text-destructive transition-smooth"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {l.selections.some((s) => s.addOnIds.length > 0) && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {l.selections
                          .flatMap((s) => s.addOnIds.map((id) => findAddOnName(s.groupId, id)))
                          .join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-background/60 rounded-full p-0.5">
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6 rounded-full"
                          onClick={() => updateQty(l.lineId, l.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6 rounded-full"
                          onClick={() => updateQty(l.lineId, l.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-accent">
                        {formatBRL(l.unitPrice * l.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-destructive w-full text-center pt-2"
              >
                Limpar carrinho
              </button>
            </div>

            <div className="border-t border-border/50 p-4 space-y-3 bg-card">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatBRL(sub)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Entrega</span>
                  <span>{formatBRL(STORE.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span>
                  <span className="text-gradient-neon">{formatBRL(sub + STORE.deliveryFee)}</span>
                </div>
              </div>

              {!minOk && (
                <p className="text-xs text-accent text-center">
                  Pedido mínimo: {formatBRL(STORE.minOrder)}. Faltam {formatBRL(STORE.minOrder - sub)}.
                </p>
              )}

              <Button
                onClick={handleCheckout}
                disabled={!minOk}
                className="w-full h-12 bg-gradient-gold text-accent-foreground font-bold text-base shadow-gold hover:opacity-90"
              >
                Finalizar pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </Sheet>
  );
}
