import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Banknote, QrCode, Wallet, Store, Truck, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBRL, DELIVERY_FEE } from "@/store/cart";
import { STORE, categories } from "@/data/menu";
import { getStoreStatus } from "@/lib/hours";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  phone: z.string().trim().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  cpf: z.string().trim().max(14).optional().or(z.literal("")),
  // delivery only
  cep: z.string().trim().transform(onlyDigits).refine((v) => v.length === 0 || v.length === 8, "CEP inválido").optional().or(z.literal("")),
  street: z.string().trim().max(120).optional().or(z.literal("")),
  number: z.string().trim().max(10).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  payment: z.enum(["pix", "credit", "debit", "cash"]),
  cashChange: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

type Form = z.input<typeof checkoutSchema>;

const findAddOnName = (groupId: string, addOnId: string) => {
  for (const cat of categories) {
    for (const item of cat.items) {
      const g = item.groups.find((gr) => gr.id === groupId);
      if (g) { const a = g.items.find((x) => x.id === addOnId); if (a) return a.name; }
    }
  }
  return addOnId;
};

const formatCEP = (s: string) => { const d = onlyDigits(s).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
const formatPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a})`, b && ` ${b}`, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};
const formatCPF = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  return d.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, a, b, c, e) => [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].filter(Boolean).join(""));
};
const genOrderId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const PAYMENTS = [
  { id: "pix", label: "PIX", icon: QrCode, hint: "Aprovação instantânea" },
  { id: "credit", label: "Crédito na entrega", icon: CreditCard, hint: "Maquininha" },
  { id: "debit", label: "Débito na entrega", icon: Wallet, hint: "Maquininha" },
  { id: "cash", label: "Dinheiro", icon: Banknote, hint: "Informe o troco" },
] as const;

type Props = { open: boolean; onClose: () => void };

export function CheckoutModal({ open, onClose }: Props) {
  const { lines, subtotal, discount, deliveryFee, total, clear, setOpen: setCartOpen, pickupMode, setPickupMode } = useCart();
  const [form, setForm] = useState<Form>({
    name: "", phone: "", cpf: "", cep: "", street: "", number: "", district: "",
    city: "", complement: "", reference: "", payment: "pix", cashChange: "", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("");

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const lookupCep = async (raw: string) => {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) { toast.error("CEP não encontrado"); return; }
      setForm((f) => ({ ...f, street: data.logradouro || f.street, district: data.bairro || f.district, city: data.localidade || f.city }));
    } catch { toast.error("Não foi possível buscar o CEP"); }
    finally { setCepLoading(false); }
  };

  const storeStatus = getStoreStatus();
  const sub = subtotal();
  const disc = discount();
  const fee = deliveryFee();
  const tot = total();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeStatus.isOpen) { toast.error("A loja está fechada no momento."); return; }

    // Validate address only if delivery
    const toValidate = { ...form };
    if (pickupMode) {
      toValidate.cep = "";
      toValidate.street = "";
      toValidate.number = "";
      toValidate.district = "";
      toValidate.city = "";
    }

    const result = checkoutSchema.safeParse(toValidate);
    if (!result.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Form;
        if (!errs[key]) errs[key] = issue.message;
      }
      // Manual required check for delivery fields
      if (!pickupMode) {
        if (!form.street?.trim()) errs.street = "Informe a rua";
        if (!form.number?.trim()) errs.number = "Informe o número";
        if (!form.district?.trim()) errs.district = "Informe o bairro";
        if (!form.city?.trim()) errs.city = "Informe a cidade";
        if (onlyDigits(form.cep ?? "").length !== 8) errs.cep = "CEP inválido";
      }
      setErrors(errs);
      toast.error("Revise os campos destacados");
      return;
    }

    const d = result.data;
    const id = genOrderId();

    const itemsText = lines.map((l) => {
      const extras = l.selections.flatMap((sel) => sel.addOnIds.map((aid) => findAddOnName(sel.groupId, aid))).join(", ");
      return `▸ ${l.quantity}x ${l.item.name} — ${formatBRL(l.unitPrice * l.quantity)}${extras ? `\n   _Adicionais:_ ${extras}` : ""}${l.notes ? `\n   _Obs:_ ${l.notes}` : ""}`;
    }).join("\n\n");

    const paymentLabel = PAYMENTS.find((p) => p.id === d.payment)?.label ?? d.payment;
    const cashLine = d.payment === "cash" && d.cashChange ? `\n*Troco para:* ${d.cashChange}` : "";
    const addressBlock = pickupMode
      ? `*Retirada na loja* 🏪`
      : `${d.street}, ${d.number}${d.complement ? ` — ${d.complement}` : ""}\n${d.district} · ${d.city}\nCEP ${formatCEP(d.cep ?? "")}${d.reference ? `\n_Referência:_ ${d.reference}` : ""}`;

    const msg =
      `*🛒 Pedido #${id} — ${STORE.name}*\n\n` +
      `*Cliente:* ${d.name}\n*Telefone:* ${formatPhone(d.phone)}${d.cpf ? `\n*CPF na nota:* ${formatCPF(d.cpf)}` : ""}\n\n` +
      `*${pickupMode ? "Retirada" : "Endereço de entrega"}:*\n${addressBlock}\n\n` +
      `*Itens:*\n${itemsText}\n\n` +
      `─────────────────\n` +
      `*Subtotal:* ${formatBRL(sub)}\n` +
      (disc > 0 ? `*Desconto:* − ${formatBRL(disc)}\n` : "") +
      `*Entrega:* ${fee === 0 ? "Grátis 🎉" : formatBRL(fee)}\n` +
      `*TOTAL:* ${formatBRL(tot)}\n\n` +
      `*Pagamento:* ${paymentLabel}${cashLine}` +
      `${d.notes ? `\n\n*Observações:* ${d.notes}` : ""}`;

    setOrderId(id);
    setWhatsappMsg(msg);
    setStep("success");
  };

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`, "_blank");
    clear();
    setCartOpen(false);
    onClose();
    setStep("form");
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep("form"), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto bg-card border-border/60">

        {step === "success" ? (
          /* ── SUCCESS SCREEN ── */
          <div className="flex flex-col items-center text-center py-6 gap-5">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center animate-float">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-lg">
                🎉
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Pedido pronto!</p>
              <h2 className="text-3xl font-display font-medium">#{orderId}</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Seu pedido está pronto para ser enviado pelo WhatsApp.<br />
                Clique no botão abaixo para confirmar com a loja!
              </p>
            </div>

            {/* Order summary */}
            <div className="w-full bg-secondary/40 rounded-xl p-4 space-y-2 border border-border/40 text-left">
              {lines.map((l) => (
                <div key={l.lineId} className="flex items-center gap-3">
                  <img src={l.item.image} alt={l.item.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{l.quantity}x {l.item.name}</p>
                  </div>
                  <span className="text-sm text-gold font-semibold shrink-0">{formatBRL(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border/40 pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-gold">{formatBRL(tot)}</span>
              </div>
            </div>

            <Button
              onClick={handleOpenWhatsApp}
              className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar pelo WhatsApp
            </Button>
            <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Cancelar e voltar ao cardápio
            </button>
          </div>
        ) : (
          /* ── FORM SCREEN ── */
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Finalizar pedido</DialogTitle>
              <DialogDescription>Informe seus dados para concluir.</DialogDescription>
            </DialogHeader>

            {/* Store closed warning */}
            {!storeStatus.isOpen && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                <span className="text-base">⛔</span>
                <span>A loja está fechada no momento. {storeStatus.nextChange}.</span>
              </div>
            )}

            {/* Photo summary */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {lines.map((l) => (
                <div key={l.lineId} className="shrink-0 flex flex-col items-center gap-1">
                  <img src={l.item.image} alt={l.item.name} className="h-14 w-14 rounded-xl object-cover border border-border/40" />
                  <span className="text-[0.6rem] text-muted-foreground text-center w-14 truncate">{l.quantity}x {l.item.name}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pickup toggle */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: false, label: "Entrega", icon: Truck },
                  { mode: true, label: "Retirada", icon: Store },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPickupMode(mode)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-smooth ${
                      pickupMode === mode ? "bg-gold/10 border-gold/60 text-gold" : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-gold/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Contato</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Nome completo" error={errors.name}>
                    <Input value={form.name} maxLength={80} onChange={(e) => update("name", e.target.value)} placeholder="Seu nome" />
                  </Field>
                  <Field label="Telefone (WhatsApp)" error={errors.phone}>
                    <Input value={formatPhone(form.phone)} inputMode="numeric" onChange={(e) => update("phone", onlyDigits(e.target.value))} placeholder="(11) 99999-9999" />
                  </Field>
                </div>
                <Field label="CPF na nota" optional>
                  <Input value={formatCPF(form.cpf ?? "")} inputMode="numeric" maxLength={14} onChange={(e) => update("cpf", onlyDigits(e.target.value))} placeholder="000.000.000-00 (opcional)" />
                </Field>
              </div>

              {/* Address — only if delivery */}
              {!pickupMode && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Endereço de entrega</h4>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="CEP" error={errors.cep} className="sm:col-span-1">
                      <div className="relative">
                        <Input
                          value={formatCEP(form.cep ?? "")}
                          inputMode="numeric"
                          maxLength={9}
                          onChange={(e) => { const v = onlyDigits(e.target.value); update("cep", v); if (v.length === 8) void lookupCep(v); }}
                          placeholder="00000-000"
                        />
                        {cepLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gold" />}
                      </div>
                    </Field>
                    <Field label="Rua" error={errors.street} className="sm:col-span-2">
                      <Input value={form.street} maxLength={120} onChange={(e) => update("street", e.target.value)} placeholder="Av. Brasil" />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Número" error={errors.number}>
                      <Input value={form.number} maxLength={10} onChange={(e) => update("number", e.target.value)} placeholder="123" />
                    </Field>
                    <Field label="Bairro" error={errors.district}>
                      <Input value={form.district} maxLength={80} onChange={(e) => update("district", e.target.value)} placeholder="Centro" />
                    </Field>
                    <Field label="Cidade" error={errors.city}>
                      <Input value={form.city} maxLength={80} onChange={(e) => update("city", e.target.value)} placeholder="Sua cidade" />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Complemento" optional>
                      <Input value={form.complement} maxLength={80} onChange={(e) => update("complement", e.target.value)} placeholder="Apto, bloco..." />
                    </Field>
                    <Field label="Ponto de referência" optional>
                      <Input value={form.reference} maxLength={120} onChange={(e) => update("reference", e.target.value)} placeholder="Próximo ao mercado..." />
                    </Field>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Pagamento</h4>
                <RadioGroup value={form.payment} onValueChange={(v) => update("payment", v as Form["payment"])} className="grid grid-cols-2 gap-2">
                  {PAYMENTS.map((p) => {
                    const Icon = p.icon;
                    const active = form.payment === p.id;
                    return (
                      <Label key={p.id} htmlFor={`pay-${p.id}`} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-smooth ${active ? "bg-gold/10 border-gold/60" : "bg-secondary/30 border-border/50 hover:border-gold/40"}`}>
                        <RadioGroupItem id={`pay-${p.id}`} value={p.id} className="sr-only" />
                        <Icon className={`h-5 w-5 ${active ? "text-gold" : "text-muted-foreground"}`} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{p.label}</span>
                          <span className="text-[0.7rem] text-muted-foreground">{p.hint}</span>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
                {form.payment === "cash" && (
                  <Field label="Troco para quanto?" optional>
                    <Input value={form.cashChange} maxLength={20} onChange={(e) => update("cashChange", e.target.value)} placeholder="Ex: R$ 50,00" />
                  </Field>
                )}
              </div>

              {/* Notes */}
              <Field label="Observações gerais" optional>
                <Textarea value={form.notes} maxLength={300} rows={2} onChange={(e) => update("notes", e.target.value)} placeholder="Algo importante?" className="resize-none bg-secondary/30 border-border/50" />
              </Field>

              {/* Summary */}
              <div className="bg-secondary/40 rounded-lg p-3 text-sm space-y-1.5 border border-border/40">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({lines.length} {lines.length === 1 ? "item" : "itens"})</span>
                  <span>{formatBRL(sub)}</span>
                </div>
                {disc > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto</span><span>− {formatBRL(disc)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Entrega</span>
                  <span>{fee === 0 ? <span className="text-success">Grátis</span> : formatBRL(fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border/40">
                  <span>Total</span>
                  <span className="text-gold">{formatBRL(tot)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!storeStatus.isOpen}
                className="w-full h-12 bg-gradient-gold text-accent-foreground font-bold hover:opacity-90 shadow-gold"
              >
                Revisar e enviar pelo WhatsApp
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, optional, children, className }: {
  label: string; error?: string; optional?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs flex items-center gap-1">
        {label}
        {optional && <span className="text-muted-foreground font-normal">(opcional)</span>}
      </Label>
      {children}
      {error && <p className="text-[0.7rem] text-destructive">{error}</p>}
    </div>
  );
}
