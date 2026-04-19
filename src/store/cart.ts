import { create } from "zustand";
import type { MenuItem } from "@/data/menu";

export type CartLine = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: { groupId: string; addOnIds: string[] }[];
  notes?: string;
  unitPrice: number;
};

export const COUPONS_MAP: Record<string, { type: "percent" | "fixed"; value: number; label: string }> = {
  BEMVINDO10: { type: "percent", value: 10, label: "10% de desconto" },
  ACAI15: { type: "percent", value: 15, label: "15% de desconto" },
  FRETE0: { type: "fixed", value: 5, label: "Frete grátis" },
};

export const DELIVERY_FEE = 5;
export const MIN_ORDER = 14;

type CouponData = { type: "percent" | "fixed"; value: number; label: string };

type CartState = {
  open: boolean;
  lines: CartLine[];
  couponCode: string;
  couponData: CouponData | null;
  pickupMode: boolean;
  setOpen: (v: boolean) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  updateLine: (lineId: string, patch: Omit<CartLine, "lineId">) => void;
  removeLine: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  discount: () => number;
  deliveryFee: () => number;
  total: () => number;
  count: () => number;
  applyCoupon: (code: string) => { ok: boolean; msg: string };
  removeCoupon: () => void;
  setPickupMode: (v: boolean) => void;
};

export const useCart = create<CartState>((set, get) => ({
  open: false,
  lines: [],
  couponCode: "",
  couponData: null,
  pickupMode: false,
  setOpen: (open) => set({ open }),
  addLine: (line) =>
    set((s) => ({
      lines: [...s.lines, { ...line, lineId: crypto.randomUUID() }],
    })),
  updateLine: (lineId, patch) =>
    set((s) => ({
      lines: s.lines.map((l) => (l.lineId === lineId ? { ...patch, lineId } : l)),
    })),
  removeLine: (lineId) =>
    set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),
  updateQty: (lineId, qty) =>
    set((s) => ({
      lines: s.lines
        .map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
        .filter((l) => l.quantity > 0),
    })),
  clear: () => set({ lines: [], couponCode: "", couponData: null }),
  subtotal: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  discount: () => {
    const { couponData } = get();
    if (!couponData) return 0;
    const sub = get().subtotal();
    if (couponData.type === "percent") return sub * (couponData.value / 100);
    return Math.min(couponData.value, sub);
  },
  deliveryFee: () => (get().pickupMode ? 0 : DELIVERY_FEE),
  total: () => {
    const { subtotal, discount, deliveryFee } = get();
    return Math.max(0, subtotal() + deliveryFee() - discount());
  },
  count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
  applyCoupon: (code) => {
    const data = COUPONS_MAP[code.toUpperCase().trim()];
    if (!data) return { ok: false, msg: "Cupom inválido ou expirado" };
    set({ couponCode: code.toUpperCase().trim(), couponData: data });
    return { ok: true, msg: `Cupom aplicado: ${data.label}` };
  },
  removeCoupon: () => set({ couponCode: "", couponData: null }),
  setPickupMode: (v) => set({ pickupMode: v }),
}));

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
