import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, X } from "lucide-react";
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
  const [added, setAdded] = useState(false);

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
  }, [item]);

  const toggle = (groupId: string, addOnId: string, max: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (max === 1) {
        return { ...prev, [groupId]: current.includes(addOnId) ? [] : [addOnId] };
      }
      if (current.includes(addOnId)) {
        return { ...prev, [groupId]: current.filter((x) => x !== addOnId) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, addOnId] };
    });
  };

  const extrasPrice = item
    ? item.groups.reduce((sum, g) => {
        const sel = selections[g.id] ?? [];
        return sum + g.items.filter((i) => sel.includes(i.id)).reduce((s, i) => s + i.price, 0);
      }, 0)
    : 0;

  const unitPrice = (item?.price ?? 0) + extrasPrice;
  const total = unitPrice * qty;

  const requiredOk = item
    ? item.groups.every((g) => {
        if (!g.required) return true;
        return (selections[g.id]?.length ?? 0) >= (g.min ?? 1);
      })
    : false;

  const handleAdd = () => {
    if (!item) return;
    const payload = {
      item,
      quantity: qty,
      notes: notes.trim() || undefined,
      unitPrice,
      selections: Object.entries(selections).map(([groupId, addOnIds]) => ({ groupId, addOnIds })),
    };
    if (editLine) {
      updateLine(editLine.lineId, payload);
      toast.success("Item atualizado! 🛒");
    } else {
      addLine(payload);
      toast.success(`${item.name} adicionado! 💜`);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 500);
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="bg-card border-border/60 rounded-t-2xl p-0 max-h-[92vh] flex flex-col"
      >
        {item && (
          <>
            {/* Image header */}
            <div className="relative h-44 overflow-hidden rounded-t-2xl shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              {item.badge && (
                <Badge className="absolute top-3 left-3 bg-gradient-gold border-0 text-accent-foreground text-xs">
                  {item.badge}
                </Badge>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-smooth"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-2xl font-display font-medium">{item.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-lg font-display font-medium text-gold">{formatBRL(item.price)}</p>
              </SheetHeader>

              <div className="space-y-5">
                {item.groups.map((g) => {
                  const sel = selections[g.id] ?? [];
                  const isSingle = g.max === 1;
                  const pct = g.max > 0 ? (sel.length / g.max) * 100 : 0;

                  return (
                    <div key={g.id}>
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {g.title}
                            {g.required && <span className="text-gold ml-1 text-xs">*obrigatório</span>}
                          </p>
                          {g.description && (
                            <p className="text-xs text-muted-foreground">{g.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                          {sel.length}/{g.max}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {sel.length > 0 && (
                        <div className="h-1 rounded-full bg-border/40 mb-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-gold transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-1.5">
                        {g.items.map((opt) => {
                          const checked = sel.includes(opt.id);
                          const disabled = !checked && sel.length >= g.max;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggle(g.id, opt.id, g.max)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                                checked
                                  ? "bg-gold/10 border-gold/50 text-foreground"
                                  : disabled
                                  ? "border-border/30 bg-secondary/10 opacity-40 cursor-not-allowed"
                                  : "border-border/40 bg-secondary/30 hover:border-gold/40 hover:bg-secondary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {/* Custom radio/checkbox visual */}
                                <div
                                  className={`shrink-0 flex items-center justify-center border-2 transition-all duration-150 ${
                                    isSingle
                                      ? "h-4 w-4 rounded-full"
                                      : "h-4 w-4 rounded-md"
                                  } ${
                                    checked
                                      ? "border-gold bg-gold"
                                      : "border-muted-foreground/40 bg-transparent"
                                  }`}
                                >
                                  {checked && (
                                    <svg className="h-2.5 w-2.5 text-accent-foreground" viewBox="0 0 10 10" fill="currentColor">
                                      {isSingle
                                        ? <circle cx="5" cy="5" r="3" />
                                        : <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                      }
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm">{opt.name}</span>
                              </div>
                              {opt.price > 0 && (
                                <span className="text-xs font-semibold text-gold shrink-0">
                                  + {formatBRL(opt.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Notes */}
                <div>
                  <p className="font-semibold text-sm mb-2">Observações</p>
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
            <div className="border-t border-border/50 bg-card px-5 py-4 flex items-center gap-3 shrink-0">
              {/* Qty */}
              <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-1 py-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-background/60 transition-smooth"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-sm">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-background/60 transition-smooth"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add button */}
              <Button
                onClick={handleAdd}
                disabled={!requiredOk || added}
                className={`flex-1 h-11 font-bold text-sm transition-all duration-300 ${
                  added
                    ? "bg-success/20 border border-success/50 text-success cursor-default"
                    : "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
                }`}
              >
                {added
                  ? "✓ Adicionado!"
                  : `${editLine ? "Atualizar" : "Adicionar"} · ${formatBRL(total)}`}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
