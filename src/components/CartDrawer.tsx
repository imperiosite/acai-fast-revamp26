import { useState, useEffect } from "react";
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
      if (g) { const a = g.items.find((x) => x.id === addOnId); if (a) return a.name; }
    }
  }
  return addOnId;
};

const S = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" } as React.CSSProperties,
  muted: { color: "var(--muted-foreground,#9a8a9d)" } as React.CSSProperties,
  gold: { color: "var(--gold,#c4a35a)" } as React.CSSProperties,
};

export function CartDrawer() {
  const { open, setOpen, lines, updateQty, removeLine, subtotal, discount, deliveryFee, total, clear, couponCode, couponData, applyCoupon, removeCoupon } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [editLine, setEditLine] = useState<CartLine | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 280);
  };

  const sub = subtotal();
  const disc = discount();
  const fee = deliveryFee();
  const tot = total();
  const minOk = sub >= STORE.minOrder;
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = applyCoupon(couponInput);
    if (result.ok) { toast.success(result.msg); setCouponInput(""); }
    else toast.error(result.msg);
  };

  if (!open) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
        {/* Backdrop */}
        <div
          onClick={handleClose}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
        />

        {/* Side drawer */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "min(420px, 100vw)",
          background: "var(--card,#1a0d1e)",
          display: "flex", flexDirection: "column",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "-4px 0 40px rgba(0,0,0,0.4)",
        }}>
          {/* Header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <ShoppingBag size={18} color="var(--gold,#c4a35a)" />
            <span style={{ fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Seu carrinho</span>
            {count > 0 && (
              <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.07)", padding: "2px 10px", borderRadius: 999, color: "var(--muted-foreground,#9a8a9d)" }}>
                {count} {count === 1 ? "item" : "itens"}
              </span>
            )}
            <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "var(--muted-foreground,#9a8a9d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>

          {lines.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "2rem", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(196,163,90,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingBag size={32} color="var(--gold,#c4a35a)" />
              </div>
              <p style={{ ...S.muted, margin: 0 }}>Seu carrinho está vazio</p>
              <p style={{ ...S.muted, fontSize: "0.8rem", margin: 0 }}>Escolha seu açaí e adicione itens 💜</p>
              <button onClick={handleClose} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 999, background: "linear-gradient(135deg,#c4a35a,#e2c97e)", border: "none", cursor: "pointer", color: "#1a0d1e", fontWeight: 700, fontSize: "0.9rem" }}>
                Ver cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Delivery estimate */}
              <div style={{ margin: "0.75rem 1.25rem 0", background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                <Clock size={14} color="var(--gold,#c4a35a)" />
                <span style={{ fontSize: "0.8rem", ...S.muted }}>Entrega estimada: <strong style={{ color: "var(--foreground,#f5e6ff)" }}>40–60 min</strong></span>
              </div>

              {/* Lines */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
                {lines.map((l) => (
                  <div key={l.lineId} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, display: "flex", gap: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <img src={l.item.image} alt={l.item.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.3 }}>{l.item.name}</span>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button onClick={() => setEditLine(l)} title="Editar" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--muted-foreground,#9a8a9d)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => removeLine(l.lineId)} title="Remover" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--muted-foreground,#9a8a9d)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {l.selections.some((s) => s.addOnIds.length > 0) && (
                        <p style={{ fontSize: "0.7rem", ...S.muted, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {l.selections.flatMap((s) => s.addOnIds.map((id) => findAddOnName(s.groupId, id))).join(" · ")}
                        </p>
                      )}
                      {l.notes && <p style={{ fontSize: "0.7rem", color: "var(--gold,#c4a35a)", margin: "2px 0 0", fontStyle: "italic" }}>Obs: {l.notes}</p>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "2px 4px" }}>
                          <button onClick={() => updateQty(l.lineId, l.quantity - 1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--foreground,#f5e6ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ width: 20, textAlign: "center", fontWeight: 700, fontSize: "0.85rem" }}>{l.quantity}</span>
                          <button onClick={() => updateQty(l.lineId, l.quantity + 1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--foreground,#f5e6ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <span style={{ fontWeight: 700, ...S.gold, fontSize: "0.9rem" }}>{formatBRL(l.unitPrice * l.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={clear} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", ...S.muted, padding: "4px 0" }}>
                  Limpar carrinho
                </button>
              </div>

              {/* Coupon */}
              <div style={{ padding: "0 1.25rem 0.75rem", flexShrink: 0 }}>
                {couponData ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.4)", borderRadius: 10, padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag size={14} color="var(--gold,#c4a35a)" />
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", ...S.gold }}>{couponCode}</span>
                      <span style={{ fontSize: "0.75rem", ...S.muted }}>— {couponData.label}</span>
                    </div>
                    <button onClick={removeCoupon} style={{ background: "none", border: "none", cursor: "pointer", ...S.muted }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Tag size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground,#9a8a9d)" }} />
                      <input
                        placeholder="Cupom de desconto"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 38, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "var(--foreground,#f5e6ff)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                      />
                    </div>
                    <button onClick={handleApplyCoupon} style={{ padding: "0 16px", height: 38, borderRadius: 999, border: "1px solid rgba(196,163,90,0.4)", background: "transparent", cursor: "pointer", ...S.gold, fontWeight: 600, fontSize: "0.85rem" }}>
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* Totals + CTA */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.25rem 1.25rem", flexShrink: 0, background: "var(--card,#1a0d1e)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  <div style={S.row}><span style={S.muted}>Subtotal</span><span style={S.muted}>{formatBRL(sub)}</span></div>
                  <div style={S.row}><span style={S.muted}>Entrega</span><span style={fee === 0 ? { color: "#22c55e" } : S.muted}>{fee === 0 ? "Grátis" : formatBRL(fee)}</span></div>
                  {disc > 0 && <div style={S.row}><span style={{ color: "#22c55e" }}>Desconto</span><span style={{ color: "#22c55e" }}>− {formatBRL(disc)}</span></div>}
                  <div style={{ ...S.row, fontWeight: 700, fontSize: "1rem", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4 }}>
                    <span>Total</span><span style={S.gold}>{formatBRL(tot)}</span>
                  </div>
                </div>

                {!minOk && (
                  <p style={{ fontSize: "0.75rem", ...S.gold, textAlign: "center", background: "rgba(196,163,90,0.06)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(196,163,90,0.2)", marginBottom: 10 }}>
                    Pedido mínimo: {formatBRL(STORE.minOrder)} · Faltam {formatBRL(STORE.minOrder - sub)}
                  </p>
                )}

                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={!minOk}
                  style={{
                    width: "100%", height: 48, borderRadius: 999, border: "none",
                    background: minOk ? "linear-gradient(135deg,#c4a35a,#e2c97e)" : "rgba(255,255,255,0.1)",
                    color: minOk ? "#1a0d1e" : "var(--muted-foreground,#9a8a9d)",
                    fontWeight: 700, fontSize: "1rem", cursor: minOk ? "pointer" : "not-allowed",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { if (minOk) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  Finalizar pedido
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ItemModal item={editLine?.item ?? null} editLine={editLine} onClose={() => setEditLine(null)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
