import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingBag, Tag, X, Clock, Pencil } from "lucide-react";
import { useCart, formatBRL } from "@/store/cart";
import { STORE, categories } from "@/data/menu";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ItemModal } from "@/components/ItemModal";
import { toast } from "sonner";
import type { CartLine } from "@/store/cart";

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
  const {
    open, setOpen, lines, updateQty, removeLine, subtotal,
    discount, deliveryFee, total, clear, couponCode, couponData, applyCoupon, removeCoupon,
  } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [editLine, setEditLine] = useState<CartLine | null>(null);
  const [, startTransition] = useTransition();

  const sub = subtotal();
  const disc = discount();
  const fee = deliveryFee();
  const tot = total();
  const minOk = sub >= STORE.minOrder;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = applyCoupon(couponInput);
    if (result.ok) {
      toast.success(result.msg);
      setCouponInput("");
    } else {
      toast.error(result.msg);
    }
  };

  const handleEdit = (line: CartLine) => {
    startTransition(() => setEditLine(line));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md bg-card border-border/60 flex flex-col p-0">
          <SheetHeader className="p-5 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 text-xl font-display">
              <ShoppingBag className="h-5 w-5 text-gold" />
              Seu carrinho
              {lines.length > 0 && (
                <span className="ml-auto text-xs font-sans font-normal text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                  {lines.reduce((s, l) => s + l.quantity, 0)} itens
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
              <div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center animate-float">
                <ShoppingBag className="h-10 w-10 text-gold" />
              </div>
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <p className="text-xs text-muted-foreground">Escolha seu açaí e adicione itens 💜</p>
            </div>
          ) : (
            <>
              {/* Delivery time pill */}
              <div className="flex items-center gap-2 mx-4 mt-4 bg-secondary/40 rounded-full px-4 py-2 text-xs text-muted-foreground border border-border/40">
                <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>Entrega estimada: <span className="text-foreground font-semibold">40–60 min</span></span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-2">
                {lines.map((l) => (
                  <div key={l.lineId} className="bg-secondary/40 rounded-xl p-3 flex gap-3 border border-border/30">
                    <img src={l.item.image} alt={l.item.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">{l.item.name}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(l)}
                            className="text-muted-foreground hover:text-gold transition-smooth p-0.5"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeLine(l.lineId)}
                            className="text-muted-foreground hover:text-destructive transition-smooth p-0.5"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {l.selections.some((s) => s.addOnIds.length > 0) && (
                        <p className="text-[0.7rem] text-muted-foreground mt-0.5 line-clamp-2">
                          {l.selections
                            .flatMap((s) => s.addOnIds.map((id) => findAddOnName(s.groupId, id)))
                            .join(" · ")}
                        </p>
                      )}
                      {l.notes && (
                        <p className="text-[0.7rem] text-gold/70 mt-0.5 italic">Obs: {l.notes}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-background/60 rounded-full p-0.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => updateQty(l.lineId, l.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => updateQty(l.lineId, l.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-gold text-sm">{formatBRL(l.unitPrice * l.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive w-full text-center pt-1 transition-smooth">
                  Limpar carrinho
                </button>
              </div>

              {/* Coupon */}
              <div className="px-4 pb-3">
                {couponData ? (
                  <div className="flex items-center justify-between bg-gold/10 border border-gold/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5 text-gold" />
                      <span className="text-gold font-semibold">{couponCode}</span>
                      <span className="text-muted-foreground text-xs">— {couponData.label}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Cupom de desconto"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className="pl-8 h-9 text-sm bg-secondary/30 border-border/50 uppercase"
                      />
                    </div>
                    <Button onClick={handleApplyCoupon} variant="outline" size="sm" className="h-9 border-gold/40 text-gold hover:bg-gold/10">
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border/50 p-4 space-y-3 bg-card">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatBRL(sub)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Entrega</span>
                    <span>{fee === 0 ? <span className="text-success">Grátis</span> : formatBRL(fee)}</span>
                  </div>
                  {disc > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Desconto</span>
                      <span>− {formatBRL(disc)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-border/40 mt-1">
                    <span>Total</span>
                    <span className="text-gold">{formatBRL(tot)}</span>
                  </div>
                </div>

                {!minOk && (
                  <p className="text-xs text-gold/80 text-center bg-gold/5 rounded-lg py-2 px-3 border border-gold/20">
                    Pedido mínimo: {formatBRL(STORE.minOrder)} · Faltam {formatBRL(STORE.minOrder - sub)}
                  </p>
                )}

                <Button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={!minOk}
                  className="w-full h-12 bg-gradient-gold text-accent-foreground font-bold text-base shadow-gold hover:opacity-90"
                >
                  Finalizar pedido
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit item modal */}
      <ItemModal
        item={editLine?.item ?? null}
        editLine={editLine}
        onClose={() => setEditLine(null)}
      />

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
