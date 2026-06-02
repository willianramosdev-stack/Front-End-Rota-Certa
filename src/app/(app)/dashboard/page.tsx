"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, Route, TrendingUp } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buscarRelatorio } from "@/lib/api";
import { obterUsuario } from "@/lib/auth";
import { moeda } from "@/lib/format";
import type { RelatorioMensal } from "@/types";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function Home() {
  const hoje = new Date();
  const usuario = obterUsuario();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [relatorio, setRelatorio] = useState<RelatorioMensal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setCarregando(true);
    setErro("");
    buscarRelatorio(ano, mes)
      .then(setRelatorio)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [ano, mes]);

  const lucroPositivo = (relatorio?.lucroTotal ?? 0) >= 0;
  const mesNome = MESES[mes - 1];

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-amber-100">Painel financeiro</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Olá{usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 max-w-xl text-sm text-amber-50/90">
          Acompanhe frete, gastos e lucro das suas viagens. Use o assistente para
          estimar rotas antes de pegar a estrada.
        </p>
      </section>

      <PageHeader
        title="Resumo do mês"
        description={`Indicadores de ${mesNome} de ${ano}.`}
        actionLabel="Nova viagem"
        actionHref="/viagens/nova"
      />

      <Card className="mb-6 border-amber-200/60 bg-white/90 shadow-sm">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-sm font-medium">
            Mês
            <select
              className="rounded-xl border border-amber-200 bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {MESES.map((nome, i) => (
                <option key={nome} value={i + 1}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[100px] flex-col gap-1.5 text-sm font-medium">
            Ano
            <select
              className="rounded-xl border border-amber-200 bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            >
              <option value={ano - 1}>{ano - 1}</option>
              <option value={ano}>{ano}</option>
              <option value={ano + 1}>{ano + 1}</option>
            </select>
          </label>
        </CardContent>
      </Card>

      {erro && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}
      {carregando && (
        <p className="text-sm text-muted-foreground">Carregando relatório...</p>
      )}

      {relatorio && !carregando && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            titulo="Recebido"
            valor={moeda(relatorio.totalRecebido)}
            icon={DollarSign}
          />
          <MetricCard
            titulo="Gastos"
            valor={moeda(relatorio.totalGasto)}
            icon={Receipt}
          />
          <MetricCard
            titulo="Lucro"
            valor={moeda(relatorio.lucroTotal)}
            icon={TrendingUp}
            destaque={lucroPositivo ? "positivo" : "negativo"}
          />
          <MetricCard
            titulo="Viagens"
            valor={String(relatorio.quantidadeViagens)}
            icon={Route}
          />
        </div>
      )}
    </div>
  );
}
