import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Banknote, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBRL } from "@/store/cart";
import { STORE, categories } from "@/data/menu";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  cep: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v.length === 8, "CEP deve ter 8 dígitos"),
  street: z.string().trim().min(2, "Informe a rua").max(120),
  number: z.string().trim().min(1, "Informe o número").max(10),
  district: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
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
      if (g) {
        const a = g.items.find((x) => x.id === addOnId);
        if (a) return a.name;
      }
    }
  }
  return addOnId;
};

const formatCEP = (s: string) => {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const formatPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a})`, b && ` ${b}`, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};

const PAYMENTS = [
  { id: "pix", label: "PIX", icon: QrCode, hint: "Aprovação instantânea" },
  { id: "credit", label: "Crédito na entrega", icon: CreditCard, hint: "Maquininha" },
  { id: "debit", label: "Débito na entrega", icon: Wallet, hint: "Maquininha" },
  { id: "cash", label: "Dinheiro", icon: Banknote, hint: "Informe o troco" },
] as const;

type Props = { open: boolean; onClose: () => void };

export function CheckoutModal({ open, onClose }: Props) {
  const { lines, subtotal, clear, setOpen: setCartOpen } = useCart();
  const [form, setForm] = useState<Form>({
    name: "", phone: "", cep: "", street: "", number: "", district: "",
    city: "", complement: "", reference: "", payment: "pix", cashChange: "", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [cepLoading, setCepLoading] = useState(false);

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
      if (data?.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        district: data.bairro || f.district,
        city: data.localidade || f.city,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const sub = subtotal();
  const total = sub + STORE.deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Form;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      toast.error("Revise os campos destacados");
      return;
    }
    const d = result.data;

    const itemsText = lines
      .map((l) => {
        const extras = l.selections
          .flatMap((sel) => sel.addOnIds.map((id) => findAddOnName(sel.groupId, id)))
          .join(", ");
        return `▸ ${l.quantity}x ${l.item.name} — ${formatBRL(l.unitPrice * l.quantity)}${
          extras ? `\n   _Adicionais:_ ${extras}` : ""
        }${l.notes ? `\n   _Obs:_ ${l.notes}` : ""}`;
      })
      .join("\n\n");

    const paymentLabel = PAYMENTS.find((p) => p.id === d.payment)?.label ?? d.payment;
    const cashLine = d.payment === "cash" && d.cashChange ? `\n*Troco para:* ${d.cashChange}` : "";

    const msg =
      `*🛒 Novo pedido — ${STORE.name}*\n\n` +
      `*Cliente:* ${d.name}\n*Telefone:* ${d.phone}\n\n` +
      `*Endereço de entrega:*\n${d.street}, ${d.number}` +
      `${d.complement ? ` — ${d.complement}` : ""}\n${d.district} · ${d.city}\nCEP ${formatCEP(d.cep)}` +
      `${d.reference ? `\n_Referência:_ ${d.reference}` : ""}\n\n` +
      `*Itens:*\n${itemsText}\n\n` +
      `--------------------\n` +
      `*Subtotal:* ${formatBRL(sub)}\n*Entrega:* ${formatBRL(STORE.deliveryFee)}\n*TOTAL:* ${formatBRL(total)}\n\n` +
      `*Pagamento:* ${paymentLabel}${cashLine}` +
      `${d.notes ? `\n\n*Observações gerais:* ${d.notes}` : ""}`;

    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Pedido enviado! Continue no WhatsApp 💜");
    clear();
    onClose();
    setCartOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Finalizar pedido</DialogTitle>
          <DialogDescription>
            Informe seus dados de entrega e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Contato */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Contato</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome completo" error={errors.name}>
                <Input
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="Telefone (WhatsApp)" error={errors.phone}>
                <Input
                  value={formatPhone(form.phone)}
                  inputMode="numeric"
                  onChange={(e) => update("phone", onlyDigits(e.target.value))}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Endereço</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="CEP" error={errors.cep} className="sm:col-span-1">
                <div className="relative">
                  <Input
                    value={formatCEP(form.cep)}
                    inputMode="numeric"
                    maxLength={9}
                    onChange={(e) => {
                      const v = onlyDigits(e.target.value);
                      update("cep", v);
                      if (v.length === 8) void lookupCep(v);
                    }}
                    placeholder="00000-000"
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gold" />
                  )}
                </div>
              </Field>
              <Field label="Rua" error={errors.street} className="sm:col-span-2">
                <Input
                  value={form.street}
                  maxLength={120}
                  onChange={(e) => update("street", e.target.value)}
                  placeholder="Av. Brasil"
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Número" error={errors.number}>
                <Input
                  value={form.number}
                  maxLength={10}
                  onChange={(e) => update("number", e.target.value)}
                  placeholder="123"
                />
              </Field>
              <Field label="Bairro" error={errors.district}>
                <Input
                  value={form.district}
                  maxLength={80}
                  onChange={(e) => update("district", e.target.value)}
                  placeholder="Centro"
                />
              </Field>
              <Field label="Cidade" error={errors.city}>
                <Input
                  value={form.city}
                  maxLength={80}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Sua cidade"
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Complemento" optional>
                <Input
                  value={form.complement}
                  maxLength={80}
                  onChange={(e) => update("complement", e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </Field>
              <Field label="Ponto de referência" optional>
                <Input
                  value={form.reference}
                  maxLength={120}
                  onChange={(e) => update("reference", e.target.value)}
                  placeholder="Próximo ao mercado..."
                />
              </Field>
            </div>
          </div>

          {/* Pagamento */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Pagamento</h4>
            <RadioGroup
              value={form.payment}
              onValueChange={(v) => update("payment", v as Form["payment"])}
              className="grid grid-cols-2 gap-2"
            >
              {PAYMENTS.map((p) => {
                const Icon = p.icon;
                const active = form.payment === p.id;
                return (
                  <Label
                    key={p.id}
                    htmlFor={`pay-${p.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-smooth ${
                      active
                        ? "bg-gold/10 border-gold/60"
                        : "bg-secondary/30 border-border/50 hover:border-gold/40"
                    }`}
                  >
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
                <Input
                  value={form.cashChange}
                  maxLength={20}
                  onChange={(e) => update("cashChange", e.target.value)}
                  placeholder="Ex: R$ 50,00 (deixe vazio se não precisa)"
                />
              </Field>
            )}
          </div>

          {/* Obs gerais */}
          <Field label="Observações gerais" optional>
            <Textarea
              value={form.notes}
              maxLength={300}
              rows={2}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Algo importante para o entregador?"
              className="resize-none bg-secondary/30 border-border/50"
            />
          </Field>

          {/* Resumo */}
          <div className="bg-secondary/40 rounded-lg p-3 text-sm space-y-1 border border-border/50">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({lines.length} {lines.length === 1 ? "item" : "itens"})</span>
              <span>{formatBRL(sub)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Entrega</span>
              <span>{formatBRL(STORE.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border/50 mt-1">
              <span>Total</span>
              <span className="text-gold">{formatBRL(total)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-gold text-accent-foreground font-bold hover:opacity-90 shadow-gold"
          >
            Enviar pedido pelo WhatsApp
          </Button>
          <p className="text-[0.7rem] text-center text-muted-foreground">
            Site de demonstração — nenhum pedido real será enviado.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
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
