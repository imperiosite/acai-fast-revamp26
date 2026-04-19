import { create } from "zustand";
import type { MenuItem } from "@/data/menu";

export type CartLine = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: { groupId: string; addOnIds: string[] }[];
  notes?: string;
  unitPrice: number; // base + paid add-ons
};

type CartState = {
  open: boolean;
  lines: CartLine[];
  setOpen: (v: boolean) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  removeLine: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  open: false,
  lines: [],
  setOpen: (open) => set({ open }),
  addLine: (line) =>
    set((s) => ({
      lines: [...s.lines, { ...line, lineId: crypto.randomUUID() }],
      open: true,
    })),
  removeLine: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),
  updateQty: (lineId, qty) =>
    set((s) => ({
      lines: s.lines
        .map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
        .filter((l) => l.quantity > 0),
    })),
  clear: () => set({ lines: [] }),
  subtotal: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
}));

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
