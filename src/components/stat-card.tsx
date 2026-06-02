import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  titulo: string;
  valor: string;
  icon: LucideIcon;
  tom?: "neutro" | "verde" | "vermelho" | "amber" | "azul";
};

const TONS = {
  neutro: "from-slate-50 to-background border-slate-200/80 text-slate-700",
  verde: "from-emerald-50 to-background border-emerald-200/80 text-emerald-700",
  vermelho: "from-red-50 to-background border-red-200/80 text-red-600",
  amber: "from-amber-50 to-background border-amber-200/80 text-amber-800",
  azul: "from-sky-50 to-background border-sky-200/80 text-sky-700",
} as const;

export function StatCard({
  titulo,
  valor,
  icon: Icon,
  tom = "neutro",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md",
        TONS[tom]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {titulo}
        </p>
        <span className="rounded-lg bg-white/70 p-2 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{valor}</p>
    </div>
  );
}
