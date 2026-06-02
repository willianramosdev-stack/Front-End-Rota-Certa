"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const IMAGEM_CARRETA = "/images/carreta-itera360.png";

type CaminhaoAnimadoProps = {
  className?: string;
  imagemClassName?: string;
  duracaoMs?: number;
  margemPx?: number;
  src?: string;
  alt?: string;
};

export function CaminhaoAnimado({
  className,
  imagemClassName = "h-8 w-auto sm:h-14",
  duracaoMs = 10000,
  margemPx = 16,
  src = IMAGEM_CARRETA,
  alt = "",
}: CaminhaoAnimadoProps) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const caminhaoRef = useRef<HTMLDivElement>(null);
  const imagemRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const caminhao = caminhaoRef.current;
    const faixa = faixaRef.current;
    const imagem = imagemRef.current;
    if (!caminhao || !faixa) return;

    let frameId = 0;
    let inicio = 0;
    let fim = 0;
    let inicioAnimacao: number | null = null;

    const medir = () => {
      const larguraFaixa = faixa.getBoundingClientRect().width || window.innerWidth;
      const larguraCaminhao = caminhao.getBoundingClientRect().width || 320;

      if (larguraFaixa < 10) return false;

      inicio = -(larguraCaminhao + margemPx);
      fim = larguraFaixa + margemPx;
      return true;
    };

    const animar = (timestamp: number) => {
      if (inicioAnimacao === null) inicioAnimacao = timestamp;

      const decorrido = (timestamp - inicioAnimacao) % duracaoMs;
      const progresso = decorrido / duracaoMs;
      const x = Math.round(inicio + (fim - inicio) * progresso);

      caminhao.style.transform = `translate3d(${x}px, -50%, 0)`;
      frameId = requestAnimationFrame(animar);
    };

    const iniciar = () => {
      cancelAnimationFrame(frameId);
      inicioAnimacao = null;

      if (!medir()) return;

      frameId = requestAnimationFrame(animar);
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(iniciar);
    });

    const observer = new ResizeObserver(iniciar);
    observer.observe(faixa);

    imagem?.addEventListener("load", iniciar);
    if (imagem?.complete) iniciar();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(frameId);
      observer.disconnect();
      imagem?.removeEventListener("load", iniciar);
    };
  }, [duracaoMs, margemPx]);

  return (
    <div
      ref={faixaRef}
      aria-hidden
      className={cn(
        "pointer-events-none relative overflow-x-clip overflow-y-visible",
        className
      )}
    >
      <div
        ref={caminhaoRef}
        className="absolute top-1/2 left-0 [backface-visibility:hidden] [transform:translateZ(0)] will-change-transform"
      >
        <img
          ref={imagemRef}
          src={src}
          alt={alt}
          draggable={false}
          decoding="async"
          className={cn(
            "block max-w-none select-none object-contain",
            imagemClassName
          )}
        />
      </div>
    </div>
  );
}
