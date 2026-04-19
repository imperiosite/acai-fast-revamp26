import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import { useCart, formatBRL } from "@/store/cart";
import type { MenuItem } from "@/data/menu";

type Props = {
  item: MenuItem | null;
  onClose: () => void;
};

export function ItemModal({ item, onClose }: Props) {
  const addLine = useCart((s) => s.addLine);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  if (!item) return null;

  const toggle = (groupId: string, addOnId: string, max: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
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

  const reset = () => {
    setQty(1);
    setNotes("");
    setSelections({});
  };

  const handleAdd = () => {
    addLine({
      item,
      quantity: qty,
      notes: notes.trim() || undefined,
      unitPrice,
      selections: Object.entries(selections).map(([groupId, addOnIds]) => ({ groupId, addOnIds })),
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 bg-card border-border/60">
        <div className="relative h-56 overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          {item.badge && (
            <Badge className="absolute top-3 left-3 bg-gradient-primary border-0 text-primary-foreground shadow-glow-pink">
              {item.badge}
            </Badge>
          )}
        </div>

        <div className="px-6 pb-6 -mt-8 relative overflow-y-auto max-h-[calc(90vh-14rem)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {item.description}
            </DialogDescription>
            <div className="text-2xl font-bold text-gradient-neon mt-1">{formatBRL(item.price)}</div>
          </DialogHeader>

          <div className="space-y-5 mt-5">
            {item.groups.map((g) => {
              const sel = selections[g.id] ?? [];
              return (
                <div key={g.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {g.title} {g.required && <span className="text-accent">*</span>}
                      </h4>
                      {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{sel.length}/{g.max}</span>
                  </div>
                  <div className="grid gap-1.5">
                    {g.items.map((opt) => {
                      const checked = sel.includes(opt.id);
                      const disabled = !checked && sel.length >= g.max;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-smooth cursor-pointer ${
                            checked
                              ? "bg-primary/15 border-primary/60"
                              : "border-border/50 hover:border-primary/40 bg-secondary/30"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={() => toggle(g.id, opt.id, g.max)}
                            />
                            <span className="text-sm">{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-xs text-accent font-semibold">+ {formatBRL(opt.price)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div>
              <h4 className="font-semibold text-sm mb-2">Observações</h4>
              <Textarea
                placeholder="Ex: sem leite condensado, capricha no morango..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary/30 border-border/50 resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-full p-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => setQty(qty + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!requiredOk}
            className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow-pink h-11"
          >
            Adicionar · {formatBRL(total)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
