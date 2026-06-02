"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";

import type { PontoMapa } from "@/lib/distancia";
import { cn } from "@/lib/utils";

const MapaRotaInner = dynamic(() => import("@/components/mapa-rota-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl bg-amber-50/60">
      <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
    </div>
  ),
});

type MapaRotaProps = {
  origem: PontoMapa | null;
  destino: PontoMapa | null;
  trilha?: [number, number][];
  carregando?: boolean;
  titulo?: string;
  subtitulo?: string;
  altura?: number;
  className?: string;
};

export function MapaRota({
  origem,
  destino,
  trilha = [],
  carregando = false,
  titulo = "Rota no mapa",
  subtitulo,
  altura = 360,
  className,
}: MapaRotaProps) {
  const temRota = !!origem && !!destino;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-amber-200/70 bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-amber-100/80 bg-gradient-to-r from-amber-50/90 to-background px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <MapPin className="h-4 w-4 text-amber-600" />
            {titulo}
          </p>
          {subtitulo && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Origem
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Destino
          </span>
        </div>
      </div>

      <div style={{ height: altura }}>
        {carregando && (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              Traçando rota no mapa...
            </div>
          </div>
        )}

        {!carregando && !temRota && (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50/50 to-muted/20 px-6 text-center">
            <MapPin className="h-8 w-8 text-amber-300" />
            <p className="text-sm font-medium text-foreground">
              Selecione origem e destino
            </p>
            <p className="text-xs text-muted-foreground">
              O mapa aparece quando as duas cidades forem válidas (ex: alfenas-mg).
            </p>
          </div>
        )}

        {!carregando && temRota && (
          <MapaRotaInner
            origem={origem}
            destino={destino}
            trilha={trilha}
            altura={altura}
          />
        )}
      </div>
    </div>
  );
}
