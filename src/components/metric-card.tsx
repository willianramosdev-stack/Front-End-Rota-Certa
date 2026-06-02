import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  titulo: string;
  valor: string;
  icon: LucideIcon;
  destaque?: "positivo" | "negativo" | "neutro";
};

export function MetricCard({
  titulo,
  valor,
  icon: Icon,
  destaque = "neutro",
}: MetricCardProps) {
  return (
    <Card className="group overflow-hidden border-amber-200/60 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-lg">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 opacity-80 transition-opacity group-hover:opacity-100" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700 shadow-inner">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        <p
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-3xl",
            destaque === "positivo" && "text-emerald-700",
            destaque === "negativo" && "text-red-600"
          )}
        >
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}
