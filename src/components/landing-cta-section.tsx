"use client";

import Link from "next/link";

import { CaminhaoAnimado } from "@/components/caminhao-animado";
import { Button } from "@/components/ui/button";

export function LandingCtaSection() {
  return (
    <section className="relative shrink-0 overflow-visible border-t border-slate-200/80 bg-[#4d5761] px-4 py-6 text-center sm:py-4">
      <CaminhaoAnimado className="absolute inset-x-0 top-0 z-40 h-16 -translate-y-12 sm:h-20 sm:-translate-y-17" />

      <h2 className="text-lg font-bold text-[#e6e6e6] sm:text-2xl lg:text-3xl">
        Pronto para controlar suas viagens?
      </h2>
      <p className="mx-auto mt-2 text-sm text-[#e6e6e6] sm:mt-3 sm:text-base">
        Crie sua conta em menos de um minuto e comece a registrar a primeira viagem.
      </p>
      <Button
        size="lg"
        className="mt-4 bg-amber-600 text-[#e6e6e6] shadow-md hover:bg-amber-600 sm:mt-6"
        render={<Link href="/registrar" />}
      >
        Criar conta no RotaCerta
      </Button>
    </section>
  );
}
