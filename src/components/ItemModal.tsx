import { useState, useEffect, useRef } from "react";
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
  const [visible, setVisible] = useState(false);
  const prevItem = useRef<MenuItem | null>(null);

  // Animate open/close
  useEffect(() => {
    if (item) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [!!item]);

  // Reset state when item changes
  useEffect(() => {
    if (!item || item === prevItem.current) return;
    prevItem.current = item;
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

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const toggle = (groupId: string, addOnId: string, max: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (max === 1) return { ...prev, [groupId]: current.includes(addOnId) ? [] : [addOnId] };
      if (current.includes(addOnId)) return { ...prev, [groupId]: current.filter((x) => x !== addOnId) };
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
    ? item.groups.every((g) => !g.required || (selections[g.id]?.length ?? 0) >= (g.min ?? 1))
    : false;

  const handleAdd = () => {
    if (!item) return;
    const payload = {
      item, quantity: qty,
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
    setTimeout(() => { setAdded(false); handleClose(); }, 500);
  };

  if (!item) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)",
          transition: "opacity 0.25s ease",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: "var(--card, #1a0d1e)",
          borderRadius: "1.25rem 1.25rem 0 0",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 180, overflow: "hidden", borderRadius: "1.25rem 1.25rem 0 0", flexShrink: 0 }}>
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--card,#1a0d1e) 0%, transparent 60%)" }} />
          <button
            onClick={handleClose}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%",
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          >
            <X size={16} />
          </button>
          {item.badge && (
            <span style={{
              position: "absolute", top: 12, left: 12,
              background: "linear-gradient(135deg,#c4a35a,#e2c97e)",
              color: "#1a0d1e", fontSize: "0.65rem", fontWeight: 700,
              padding: "2px 10px", borderRadius: 999,
            }}>
              {item.badge}
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 1.25rem 1rem" }}>
          {/* Title */}
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 600, margin: "0.5rem 0 0.25rem" }}>{item.name}</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground,#9a8a9d)", margin: 0 }}>{item.description}</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gold,#c4a35a)", marginTop: "0.25rem" }}>{formatBRL(item.price)}</p>
          </div>

          {/* Groups */}
          {item.groups.map((g) => {
            const sel = selections[g.id] ?? [];
            const isSingle = g.max === 1;
            const pct = g.max > 0 ? (sel.length / g.max) * 100 : 0;

            return (
              <div key={g.id} style={{ marginBottom: "1.25rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                      {g.title}
                      {g.required && <span style={{ color: "var(--gold,#c4a35a)", fontSize: "0.75rem", marginLeft: 4 }}>*obrigatório</span>}
                    </p>
                    {g.description && <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground,#9a8a9d)", margin: "2px 0 0" }}>{g.description}</p>}
                  </div>
                  <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 999, color: "var(--muted-foreground,#9a8a9d)", whiteSpace: "nowrap", marginLeft: 8 }}>
                    {sel.length}/{g.max}
                  </span>
                </div>

                {/* Progress */}
                {sel.length > 0 && (
                  <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#c4a35a,#e2c97e)", borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                )}

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.items.map((opt) => {
                    const checked = sel.includes(opt.id);
                    const disabled = !checked && sel.length >= g.max;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(g.id, opt.id, g.max)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
                          background: checked ? "rgba(196,163,90,0.12)" : "rgba(255,255,255,0.04)",
                          outline: checked ? "1.5px solid rgba(196,163,90,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                          opacity: disabled ? 0.4 : 1,
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Radio/checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: isSingle ? "50%" : 4, border: "2px solid",
                            borderColor: checked ? "var(--gold,#c4a35a)" : "rgba(255,255,255,0.3)",
                            background: checked ? "var(--gold,#c4a35a)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
                          }}>
                            {checked && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                {isSingle
                                  ? <circle cx="5" cy="5" r="3" fill="#1a0d1e" />
                                  : <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#1a0d1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: "0.875rem", color: "var(--foreground,#f5e6ff)", textAlign: "left" }}>{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold,#c4a35a)", whiteSpace: "nowrap", marginLeft: 8 }}>
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
          <div style={{ marginBottom: "0.5rem" }}>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 6 }}>Observações</p>
            <textarea
              placeholder="Ex: sem leite condensado, capricha no morango..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "var(--foreground,#f5e6ff)",
                fontSize: "0.85rem", resize: "none", outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 1.25rem 1.25rem",
          display: "flex", gap: 10, alignItems: "center",
          background: "var(--card,#1a0d1e)", flexShrink: 0,
        }}>
          {/* Qty */}
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "4px 4px",
          }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--foreground,#f5e6ff)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Minus size={14} />
            </button>
            <span style={{ width: 24, textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--foreground,#f5e6ff)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!requiredOk || added}
            style={{
              flex: 1, height: 44, borderRadius: 999, border: "none", cursor: requiredOk && !added ? "pointer" : "not-allowed",
              background: added ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#c4a35a,#e2c97e)",
              color: added ? "#22c55e" : "#1a0d1e",
              fontWeight: 700, fontSize: "0.9rem", transition: "all 0.3s",
              outline: added ? "1.5px solid rgba(34,197,94,0.4)" : "none",
              opacity: !requiredOk ? 0.5 : 1,
            }}
          >
            {added ? "✓ Adicionado!" : `${editLine ? "Atualizar" : "Adicionar"} · ${formatBRL(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
