"use client";

import { usePathname } from "next/navigation";

import { NavLinks } from "@/components/nav-links";
import { obterUsuario } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PAGINAS_SEM_SCROLL = ["/chat", "/configuracoes", "/viagens"] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usuario = obterUsuario();
  const paginaFixa = PAGINAS_SEM_SCROLL.some((rota) => pathname === rota);

  return (
    <div
      className={cn(
        "relative flex flex-col bg-[#faf7f2]",
        paginaFixa ? "h-dvh overflow-hidden" : "min-h-screen"
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(251,191,36,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.08), transparent 35%)",
        }}
      />

      <header className="relative z-40 shrink-0 border-b border-amber-200/50 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <NavLinks pathname={pathname} />
        </div>
        {usuario && pathname !== "/dashboard" && !paginaFixa && (
          <div className="border-t border-amber-100/60 bg-amber-50/40">
            <div className="mx-auto max-w-7xl px-4 py-1.5 text-xs text-muted-foreground lg:px-6">
              Olá, <span className="font-medium text-amber-950">{usuario.nome}</span>
            </div>
          </div>
        )}
      </header>

      <main
        className={cn(
          "relative mx-auto w-full max-w-7xl",
          paginaFixa
            ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 lg:px-6"
            : "px-4 py-8 lg:px-6"
        )}
      >
        {children}
      </main>
    </div>
  );
}
