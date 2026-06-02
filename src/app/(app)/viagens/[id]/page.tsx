"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Fuel,
  Pencil,
  Receipt,
  Route,
  TrendingUp,
} from "lucide-react";

import { MapaRota } from "@/components/mapa-rota";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buscarResumoViagem,
  criarCusto,
  excluirCusto,
  listarCategorias,
  listarCustos,
} from "@/lib/api";
import { buscarRota, cidadeValida, type DadosRota } from "@/lib/distancia";
import { data, dataParaApi, formatarCidade, moeda } from "@/lib/format";
import type { ListarCategoria, ListarCusto, ResumoViagem } from "@/types";

const ATALHOS_GASTO = [
  { nome: "Combustível", label: "Combustível", icon: Fuel },
  { nome: "Pedágio", label: "Pedágio", icon: Route },
  { nome: "Alimentação", label: "Alimentação", icon: Receipt },
  { nome: "Outros", label: "Diversos", icon: DollarSign },
];

export default function ViagemDetalhePage({ params }: { params: { id: string } }) {
  const viagemId = Number(params.id);
  const valorInputRef = useRef<HTMLInputElement>(null);
  const [resumo, setResumo] = useState<ResumoViagem | null>(null);
  const [rota, setRota] = useState<DadosRota | null>(null);
  const [mapaCarregando, setMapaCarregando] = useState(false);
  const [custos, setCustos] = useState<ListarCusto[]>([]);
  const [categorias, setCategorias] = useState<ListarCategoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataCusto, setDataCusto] = useState("");

  function carregar() {
    setCarregando(true);
    setErro("");
    Promise.all([
      buscarResumoViagem(viagemId),
      listarCustos(viagemId),
      listarCategorias(),
    ])
      .then(([resumoData, custosData, cats]) => {
        setResumo(resumoData);
        setCustos(custosData);
        setCategorias(cats);
        if (cats.length && !categoriaId) {
          setCategoriaId(String(cats[0].id));
        }
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    setDataCusto(new Date().toISOString().slice(0, 10));
    carregar();
  }, [viagemId]);

  useEffect(() => {
    if (!resumo) return;
    if (!cidadeValida(resumo.origem) || !cidadeValida(resumo.destino)) return;

    let cancelado = false;
    setMapaCarregando(true);

    buscarRota(resumo.origem, resumo.destino)
      .then((dados) => {
        if (!cancelado) setRota(dados);
      })
      .catch(() => {
        if (!cancelado) setRota(null);
      })
      .finally(() => {
        if (!cancelado) setMapaCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [resumo]);

  function escolherCategoria(nomeCategoria: string, label: string) {
    const cat = categorias.find(
      (c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase()
    );
    if (cat) {
      setCategoriaId(String(cat.id));
      setDescricao(label);
      valorInputRef.current?.focus();
    }
  }

  async function adicionarCusto(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      await criarCusto(viagemId, {
        categoriaCustoId: Number(categoriaId),
        descricao,
        valor: Number(valor),
        data: dataParaApi(dataCusto),
      });
      setDescricao("");
      setValor("");
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar gasto");
    }
  }

  async function deletarCusto(id: number) {
    if (!confirm("Excluir este gasto?")) return;
    try {
      await excluirCusto(id);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  if (carregando) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Carregando viagem...
      </p>
    );
  }

  if (!resumo) {
    return <p className="text-red-600">{erro || "Viagem não encontrada"}</p>;
  }

  const lucroPositivo = resumo.lucroLiquido >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/viagens"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às viagens
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            {formatarCidade(resumo.origem)}
            <span className="mx-2 text-amber-600">→</span>
            {formatarCidade(resumo.destino)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre os gastos da viagem e acompanhe o lucro em tempo real.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-amber-200"
          render={<Link href={`/viagens/${viagemId}/editar`} />}
        >
          <Pencil className="h-4 w-4" />
          Editar viagem
        </Button>
      </div>

      {erro && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <MapaRota
        origem={rota?.origem ?? null}
        destino={rota?.destino ?? null}
        trilha={rota?.trilha ?? []}
        carregando={mapaCarregando}
        titulo="Trajeto da viagem"
        subtitulo={`${resumo.kmRodados} km ida e volta`}
        altura={320}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Frete" valor={moeda(resumo.valorFrete)} icon={DollarSign} tom="azul" />
        <StatCard titulo="Gastos" valor={moeda(resumo.totalCustos)} icon={Receipt} tom="amber" />
        <StatCard
          titulo="Lucro"
          valor={moeda(resumo.lucroLiquido)}
          icon={TrendingUp}
          tom={lucroPositivo ? "verde" : "vermelho"}
        />
        <StatCard titulo="Km rodados" valor={String(resumo.kmRodados)} icon={Route} tom="neutro" />
      </div>

      <Card className="overflow-hidden border-amber-200/60 bg-white/90 shadow-sm">
        <CardHeader className="border-b border-amber-100 bg-amber-50/50">
          <CardTitle className="text-lg">Adicionar gasto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toque em um atalho ou preencha o formulário abaixo.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ATALHOS_GASTO.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.nome}
                  type="button"
                  onClick={() => escolherCategoria(a.nome, a.label)}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left text-sm font-medium transition hover:border-amber-300 hover:bg-amber-100 hover:shadow-sm"
                >
                  <span className="rounded-lg bg-amber-100 p-2 text-amber-700 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  + {a.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={adicionarCusto}
            className="grid gap-4 rounded-xl border border-dashed border-amber-200 bg-muted/10 p-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div>
              <Label>Categoria</Label>
              <select
                className="mt-1.5 w-full rounded-xl border border-amber-200 bg-background px-3 py-2 text-sm"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome === "Outros" ? "Diversos / Outros" : c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                className="mt-1.5 rounded-xl border-amber-200"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                ref={valorInputRef}
                type="number"
                min={0}
                step="0.01"
                className="mt-1.5 rounded-xl border-amber-200"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                className="mt-1.5 rounded-xl border-amber-200"
                value={dataCusto}
                onChange={(e) => setDataCusto(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
              >
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-amber-200/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Gastos registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!custos.length ? (
            <p className="p-8 text-center text-muted-foreground">
              Nenhum gasto ainda. Use os atalhos acima para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{data(c.data)}</TableCell>
                    <TableCell>
                      {c.categoriaNome === "Outros" ? "Diversos" : c.categoriaNome}
                    </TableCell>
                    <TableCell>{c.descricao}</TableCell>
                    <TableCell className="font-medium">{moeda(c.valor)}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => deletarCusto(c.id)}
                      >
                        Excluir
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
