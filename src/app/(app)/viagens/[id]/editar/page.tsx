"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { CidadeInput } from "@/components/cidade-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { atualizarViagem, buscarViagem } from "@/lib/api";
import { buscarDistanciaKm, cidadeValida } from "@/lib/distancia";
import { dataDoInput, dataParaApi, moeda } from "@/lib/format";
import type { ListarViagem } from "@/types";

export default function EditarViagemPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const router = useRouter();
  const rotaSalva = useRef("");
  const [viagem, setViagem] = useState<ListarViagem | null>(null);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [dataChegada, setDataChegada] = useState("");
  const [precoKm, setPrecoKm] = useState("");
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [valorFrete, setValorFrete] = useState("");
  const [observacao, setObservacao] = useState("");
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    buscarViagem(id)
      .then((v) => {
        setViagem(v);
        setOrigem(v.origem);
        setDestino(v.destino);
        rotaSalva.current = `${v.origem}|${v.destino}`;
        setDataSaida(dataDoInput(v.dataSaida));
        setDataChegada(dataDoInput(v.dataChegada));
        const km = v.kmRodados || v.kmFinal - v.kmInicial;
        setDistanciaKm(km);
        setValorFrete(String(v.valorFrete));
        if (km > 0) setPrecoKm(String(Math.round((v.valorFrete / km) * 100) / 100));
        setObservacao(v.observacao ?? "");
      })
      .catch((e: Error) => setErro(e.message));
  }, [id]);

  function atualizarFrete(km: number, preco: string) {
    const p = Number(preco);
    if (p > 0) setValorFrete(String(Math.round(km * p * 100) / 100));
  }

  useEffect(() => {
    if (!cidadeValida(origem) || !cidadeValida(destino) || origem === destino) {
      return;
    }

    const chave = `${origem}|${destino}`;
    if (chave === rotaSalva.current) return;

    let cancelado = false;
    const timer = setTimeout(() => {
      setCalculando(true);
      setErro("");
      buscarDistanciaKm(origem, destino)
        .then((km) => {
          if (cancelado) return;
          setDistanciaKm(km);
          atualizarFrete(km, precoKm);
          rotaSalva.current = chave;
        })
        .catch((e: Error) => {
          if (!cancelado) setErro(e.message);
        })
        .finally(() => {
          if (!cancelado) setCalculando(false);
        });
    }, 700);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [origem, destino]);

  useEffect(() => {
    if (distanciaKm != null && precoKm) {
      atualizarFrete(distanciaKm, precoKm);
    }
  }, [precoKm, distanciaKm]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!viagem) return;
    if (distanciaKm == null) {
      setErro("Aguarde o cálculo da distância.");
      return;
    }

    setErro("");
    try {
      await atualizarViagem({
        ...viagem,
        origem,
        destino,
        dataSaida: dataParaApi(dataSaida),
        dataChegada: dataChegada ? dataParaApi(dataChegada) : null,
        kmInicial: 0,
        kmFinal: distanciaKm,
        valorFrete: Number(valorFrete),
        observacao: observacao || null,
      });
      router.push(`/viagens/${id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  if (!viagem && !erro) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/viagens/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Editar viagem</h1>
      </div>

      <form onSubmit={salvar}>
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}

            <CidadeInput id="origem" label="Cidade origem" value={origem} onChange={setOrigem} required />
            <CidadeInput id="destino" label="Cidade destino" value={destino} onChange={setDestino} required />

            <div className="sm:col-span-2 text-sm text-muted-foreground">
              {calculando && <p>Calculando rota...</p>}
              {!calculando && distanciaKm != null && (
                <p>
                  <strong>{distanciaKm} km</strong> ida e volta
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dataSaida">Data saída</Label>
              <Input id="dataSaida" type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="dataChegada">Data chegada</Label>
              <Input id="dataChegada" type="date" value={dataChegada} onChange={(e) => setDataChegada(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="precoKm">Preço por km (R$)</Label>
              <Input
                id="precoKm"
                type="number"
                value={precoKm}
                onChange={(e) => setPrecoKm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="valorFrete">Valor do frete (R$)</Label>
              <Input id="valorFrete" type="number" value={valorFrete} onChange={(e) => setValorFrete(e.target.value)} required />
              {distanciaKm != null && precoKm && (
                <p className="mt-1 text-xs text-muted-foreground">{moeda(distanciaKm * Number(precoKm))}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={calculando}>
              Salvar
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
