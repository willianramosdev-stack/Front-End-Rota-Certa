import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  MessageCircle,
  Route,
  Shield,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingCtaSection } from "@/components/landing-cta-section";

const RECURSOS = [
  {
    icon: Route,
    titulo: "Controle de viagens",
    descricao: "Cadastre rotas, frete e custos em um só lugar.",
  },
  {
    icon: BarChart3,
    titulo: "Dashboard mensal",
    descricao: "Veja receita, gastos e lucro do mês com clareza.",
  },
  {
    icon: MessageCircle,
    titulo: "Assistente inteligente",
    descricao: "Estime combustível, pedágio e lucro antes de rodar.",
  },
  {
    icon: Shield,
    titulo: "Seus dados protegidos",
    descricao: "Login seguro! Cada caminhoneiro vê só as próprias viagens.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-amber-50 via-background to-muted/40">
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md sm:h-10 sm:w-10">
            <Truck className="h-5 w-5" />
          </span>
          RotaCerta
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Entrar
          </Button>
          <Button
            className="bg-amber-500 text-white hover:bg-amber-600"
            render={<Link href="/registrar" />}
          >
            Criar conta
          </Button>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <section className="mx-auto w-full max-w-6xl shrink-0 px-4 py-3 text-center sm:py-5 lg:px-6">
          <h1 className="mx-auto max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Saiba se a viagem{" "}
            <span className="text-amber-600">dá lucro</span> antes de pegar a
            estrada
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base lg:text-lg">
            O RotaCerta organiza frete, combustível, pedágio e gastos da viagem.
            Tudo em um só lugar!
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-2 sm:gap-3">
            <Button
              size="lg"
              className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
              render={<Link href="/registrar" />}
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Já tenho conta
            </Button>
          </div>
        </section>

        <section className="mx-auto grid min-h-0 flex-1 grid-cols-2 content-center gap-3 px-4 py-2 lg:max-w-6xl lg:grid-cols-4 lg:gap-4 lg:px-6">
          {RECURSOS.map(({ icon: Icon, titulo, descricao }) => (
            <article
              key={titulo}
              className="rounded-2xl border border-amber-100/80 bg-background/80 p-3 shadow-sm backdrop-blur-sm sm:p-4"
            >
              <span className="mb-2 inline-flex rounded-lg bg-amber-100 p-1.5 text-amber-700 sm:mb-3 sm:p-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                {titulo}
              </h2>
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm">
                {descricao}
              </p>
            </article>
          ))}
        </section>

        <LandingCtaSection />
      </main>
    </div>
  );
}
