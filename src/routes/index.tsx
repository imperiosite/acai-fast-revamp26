import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Menu } from "@/components/Menu";
import { CartDrawer } from "@/components/CartDrawer";
import { DemoBanner } from "@/components/DemoBanner";
import { Toaster } from "@/components/ui/sonner";
import { STORE } from "@/data/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${STORE.name} — Cardápio Digital | ${STORE.tagline}` },
      {
        name: "description",
        content: `Cardápio digital premium do ${STORE.name}. Açaí artesanal, milkshakes e adicionais especiais. Site de demonstração.`,
      },
      { property: "og:title", content: `${STORE.name} — Cardápio Digital` },
      { property: "og:description", content: "Experiência premium em delivery de açaí." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <DemoBanner />
      <Header />
      <Menu />
      <CartDrawer />
      <Toaster position="top-center" theme="dark" />
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <div className="divider-gold w-16 mx-auto mb-3">
          <span className="text-gold">✦</span>
        </div>
        <p className="font-display text-base text-foreground mb-1">{STORE.name}</p>
        <p>Site de demonstração · Cardápio digital premium</p>
      </footer>
    </main>
  );
}
