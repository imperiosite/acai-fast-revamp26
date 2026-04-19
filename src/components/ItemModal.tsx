import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ZoomIn, X } from "lucide-react";
import { useCart, formatBRL } from "@/store/cart";
import { toast } from "sonner";
import type { MenuItem } from "@/data/menu";
import type { CartLine } from "@/store/cart";

type Props = {
  item: MenuItem | null;
  onClose: () => void;
  editLine?: CartLine | null;
};

export function ItemModal({ item, onClose, editLine }: Props) {
  const addLine = useCart((s) => s.addLine);
  const updateLine = useCart((s) => s.updateLine);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [imageZoomed, setImageZoomed] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset/init state when item changes
  useEffect(() => {
    if (!item) return;
    if (editLine) {
      setQty(editLine.quantity);
      setNotes(editLine.notes ?? "");
      const sel: Record<string, string[]> = {};
      editLine.selections.forEach((s) => { sel[s.groupId] = s.addOnIds; });
      setSelections(sel);
    } else {
      setQty(1);
      setNotes("");
      setSelections({});
    }
    setAdded(false);
    setImageZoomed(false);
  }, [item, editLine]);

  if (!item) return null;

  const toggle = (groupId: string, addOnId: string, max: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (max === 1) {
        // Radio behavior: selecting one replaces the other
        return { ...prev, [groupId]: current.includes(addOnId) ? [] : [addOnId] };
      }
      if (current.includes(addOnId)) {
        return { ...prev, [groupId]: current.filter((x) => x !== addOnId) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, addOnId] };
    });
  };

  const extrasPrice = item.groups.reduce((sum, g) => {
    const sel = selections[g.id] ?? [];
    return sum + g.items.filter((i) => sel.includes(i.id)).reduce((s, i) => s + i.price, 0);
  }, 0);

  const unitPrice = item.price + extrasPrice;
  const total = unitPrice * qty;

  const requiredOk = item.groups.every((g) => {
    if (!g.required) return true;
    return (selections[g.id]?.length ?? 0) >= (g.min ?? 1);
  });

  const handleAdd = () => {
    const payload = {
      item,
      quantity: qty,
      notes: notes.trim() || undefined,
      unitPrice,
      selections: Object.entries(selections).map(([groupId, addOnIds]) => ({ groupId, addOnIds })),
    };
    if (editLine) {
      updateLine(editLine.lineId, payload);
      toast.success("Item atualizado no carrinho! 🛒");
    } else {
      addLine(payload);
      toast.success(`${item.name} adicionado! 💜`);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 400);
  };

  return (
    <>
      {/* Image zoom overlay */}
      {imageZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setImageZoomed(false)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setImageZoomed(false)}>
            <X className="h-8 w-8" />
          </button>
          <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 bg-card border-border/60">
          {/* Hero image */}
          <div className="relative h-52 overflow-hidden group cursor-zoom-in" onClick={() => setImageZoomed(true)}>
            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
              <div className="bg-black/50 rounded-full p-2">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
            {item.badge && (
              <Badge className="absolute top-3 left-3 bg-gradient-gold border-0 text-accent-foreground">
                {item.badge}
              </Badge>
            )}
          </div>

          <div className="px-5 pb-4 -mt-6 relative overflow-y-auto max-h-[calc(90vh-13rem)]">
            <DialogHeader className="text-left mb-4">
              <DialogTitle className="text-2xl font-display font-medium">{item.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">{item.description}</DialogDescription>
              <div className="text-xl font-display font-medium text-gold mt-1">{formatBRL(item.price)}</div>
            </DialogHeader>

            <div className="space-y-5">
              {item.groups.map((g) => {
                const sel = selections[g.id] ?? [];
                const isSingle = g.max === 1;
                const pct = Math.round((sel.length / g.max) * 100);
                return (
                  <div key={g.id} className="space-y-2">
                    {/* Group header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {g.title}{g.required && <span className="text-gold ml-1">*</span>}
                        </h4>
                        {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                        {sel.length}/{g.max}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {sel.length > 0 && (
                      <div className="h-1 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-gold transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}

                    {/* Options */}
                    <div className="grid gap-1.5">
                      {g.items.map((opt) => {
                        const checked = sel.includes(opt.id);
                        const disabled = !checked && sel.length >= g.max;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-smooth cursor-pointer ${
                              checked
                                ? "bg-gold/10 border-gold/50"
                                : "border-border/50 hover:border-gold/40 bg-secondary/30"
                            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSingle ? (
                                /* Radio visual */
                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-smooth ${checked ? "border-gold" : "border-muted-foreground/50"}`}>
                                  {checked && <div className="h-2 w-2 rounded-full bg-gold" />}
                                </div>
                              ) : (
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled}
                                  onCheckedChange={() => toggle(g.id, opt.id, g.max)}
                                  className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                />
                              )}
                              <span className="text-sm">{opt.name}</span>
                            </div>
                            {opt.price > 0 && (
                              <span className="text-xs text-gold font-semibold">+ {formatBRL(opt.price)}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Notes */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Observações</h4>
                <Textarea
                  placeholder="Ex: sem leite condensado, capricha no morango..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/30 border-border/50 resize-none text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(Math.max(1, qty - 1))}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center font-semibold text-sm">{qty}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(qty + 1)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!requiredOk || added}
              className={`flex-1 font-semibold h-11 transition-all duration-300 ${
                added
                  ? "bg-success/20 border border-success/50 text-success"
                  : "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
              }`}
            >
              {added ? "✓ Adicionado!" : `${editLine ? "Atualizar" : "Adicionar"} · ${formatBRL(total)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
