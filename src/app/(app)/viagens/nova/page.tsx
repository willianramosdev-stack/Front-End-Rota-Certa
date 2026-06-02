"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPinned, Save } from "lucide-react";

import { CidadeInput } from "@/components/cidade-input";
import { MapaRota } from "@/components/mapa-rota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buscarConfiguracao, criarViagem } from "@/lib/api";
import { buscarRota, cidadeValida, type DadosRota } from "@/lib/distancia";
import { dataParaApi, formatarCidade, moeda } from "@/lib/format";

export default function NovaViagemPage() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [dataChegada, setDataChegada] = useState("");
  const [precoKm, setPrecoKm] = useState("");
  const [rota, setRota] = useState<DadosRota | null>(null);
  const [valorFrete, setValorFrete] = useState("");
  const [observacao, setObservacao] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarConfiguracao()
      .then((c) => setPrecoKm(String(c.precoKmFrete)))
      .catch(() => {});
  }, []);

  function atualizarFrete(km: number, preco: string) {
    const p = Number(preco);
    if (p > 0) setValorFrete(String(Math.round(km * p * 100) / 100));
  }

  useEffect(() => {
    if (!cidadeValida(origem) || !cidadeValida(destino) || origem === destino) {
      setRota(null);
      return;
    }

    let cancelado = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCalculando(true);
      setErro("");
      buscarRota(origem, destino, controller.signal)
        .then((dados) => {
          if (cancelado) return;
          setRota(dados);
          atualizarFrete(dados.km, precoKm);
        })
        .catch((e: Error) => {
          if (!cancelado && e.name !== "AbortError") {
            setRota(null);
            setErro(e.message);
          }
        })
        .finally(() => {
          if (!cancelado) setCalculando(false);
        });
    }, 700);

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [origem, destino]);

  useEffect(() => {
    if (rota != null && precoKm) {
      atualizarFrete(rota.km, precoKm);
    }
  }, [precoKm, rota]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (rota == null) {
      setErro("Aguarde o cálculo da rota ou selecione origem e destino válidas.");
      return;
    }

    setSalvando(true);
    try {
      await criarViagem({
        origem,
        destino,
        dataSaida: dataParaApi(dataSaida),
        dataChegada: dataChegada ? dataParaApi(dataChegada) : null,
        kmInicial: 0,
        kmFinal: rota.km,
        valorFrete: Number(valorFrete),
        observacao: observacao || null,
      });
      router.push("/viagens");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  const subtituloMapa =
    rota && !calculando
      ? `${formatarCidade(origem)} → ${formatarCidade(destino)} · ${rota.kmIda} km ida · ${rota.km} km ida e volta`
      : undefined;

  return (
    <div>
      <Link
        href="/viagens"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-amber-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às viagens
      </Link>

      <div className="mt-4 mb-8">
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Nova viagem
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina a rota e veja o trajeto no mapa antes de salvar.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={salvar} className="order-2 xl:order-1">
          <Card className="border-amber-200/60 bg-white/90 shadow-sm">
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              {erro && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 sm:col-span-2">
                  {erro}
                </p>
              )}

              <CidadeInput
                id="origem"
                label="Cidade origem"
                value={origem}
                onChange={setOrigem}
                required
              />
              <CidadeInput
                id="destino"
                label="Cidade destino"
                value={destino}
                onChange={setDestino}
                required
              />

              {rota && !calculando && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm sm:col-span-2">
                  <MapPinned className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>{rota.kmIda} km</strong> ida ·{" "}
                    <strong>{rota.km} km</strong> ida e volta (estradas)
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="dataSaida">Data saída</Label>
                <Input
                  id="dataSaida"
                  type="date"
                  className="mt-1.5 rounded-xl border-amber-200"
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataChegada">Data chegada</Label>
                <Input
                  id="dataChegada"
                  type="date"
                  className="mt-1.5 rounded-xl border-amber-200"
                  value={dataChegada}
                  onChange={(e) => setDataChegada(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="precoKm">Preço por km (R$)</Label>
                <Input
                  id="precoKm"
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1.5 rounded-xl border-amber-200"
                  value={precoKm}
                  onChange={(e) => setPrecoKm(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorFrete">Valor do frete (R$)</Label>
                <Input
                  id="valorFrete"
                  type="number"
                  className="mt-1.5 rounded-xl border-amber-200"
                  value={valorFrete}
                  onChange={(e) => setValorFrete(e.target.value)}
                  required
                />
                {rota != null && precoKm && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimado: {moeda(rota.km * Number(precoKm))}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  className="mt-1.5 rounded-xl border-amber-200"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-amber-100 bg-amber-50/50 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={calculando || rota == null || salvando}
                className="gap-2"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar viagem
              </Button>
            </CardFooter>
          </Card>

          <p className="mt-4 text-sm text-muted-foreground">
            Depois de salvar, abra a viagem na lista para registrar pedágio,
            combustível e outros gastos.
          </p>
        </form>

        <div className="order-1 xl:order-2 xl:sticky xl:top-24 xl:self-start">
          <MapaRota
            origem={rota?.origem ?? null}
            destino={rota?.destino ?? null}
            trilha={rota?.trilha ?? []}
            carregando={calculando}
            subtitulo={subtituloMapa}
            altura={420}
          />
        </div>
      </div>
    </div>
  );
}
