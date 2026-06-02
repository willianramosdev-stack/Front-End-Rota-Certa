"use client";

import { useEffect, useState } from "react";
import { Fuel, Route, Save, Truck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarConfiguracao, salvarConfiguracao } from "@/lib/api";
import { consumoDoModelo, MODELOS_CAMINHAO } from "@/lib/configuracao";
import { cn } from "@/lib/utils";
import type { ConfiguracaoPerfil, SalvarConfiguracaoPerfil } from "@/types";

type FormularioConfig = {
  modeloCaminhao: string;
  apelidoVeiculo: string;
  anoVeiculo: string;
  precoKmFrete: string;
  consumoKmPorLitro: string;
  precoCombustivelLitro: string;
};

const cardClassName =
  "gap-4 rounded-2xl border border-amber-100/80 bg-white py-6 shadow-sm";

function configParaForm(c: ConfiguracaoPerfil): FormularioConfig {
  return {
    modeloCaminhao: c.modeloCaminhao,
    apelidoVeiculo: c.apelidoVeiculo ?? "",
    anoVeiculo: c.anoVeiculo != null ? String(c.anoVeiculo) : "",
    precoKmFrete: String(c.precoKmFrete),
    consumoKmPorLitro: String(c.consumoKmPorLitro),
    precoCombustivelLitro: String(c.precoCombustivelLitro),
  };
}

function formParaSalvar(form: FormularioConfig): SalvarConfiguracaoPerfil {
  return {
    modeloCaminhao: form.modeloCaminhao,
    apelidoVeiculo: form.apelidoVeiculo.trim() || null,
    anoVeiculo: form.anoVeiculo ? Number(form.anoVeiculo) : null,
    precoKmFrete: Number(form.precoKmFrete),
    consumoKmPorLitro: Number(form.consumoKmPorLitro),
    precoCombustivelLitro: Number(form.precoCombustivelLitro),
  };
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<FormularioConfig | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    buscarConfiguracao()
      .then((c) => setForm(configParaForm(c)))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  function atualizar(campo: keyof FormularioConfig, valor: string) {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setSucesso("");
  }

  function selecionarModelo(nome: string) {
    const consumo = consumoDoModelo(nome);
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modeloCaminhao: nome,
        consumoKmPorLitro:
          consumo != null ? String(consumo) : prev.consumoKmPorLitro,
      };
    });
    setSucesso("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const salvo = await salvarConfiguracao(formParaSalvar(form));
      setForm(configParaForm(salvo));
      setSucesso("Configurações salvas com sucesso.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || !form) {
    return (
      <p className="text-sm text-muted-foreground">Carregando configurações...</p>
    );
  }

  return (
    <div className="overflow-hidden">
      <PageHeader
        className="mb-6"
        title="Configurações"
        description="Veículo, frete e combustível. Pedágio e alimentação você lança em Gastos na viagem."
      />

      <form onSubmit={salvar} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className={cn(cardClassName, "lg:col-span-2")}>
            <CardHeader className="px-6 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-amber-600" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div>
                <Label htmlFor="modelo">Modelo do caminhão</Label>
                <select
                  id="modelo"
                  className="mt-1 flex h-8 w-full rounded-lg border border-amber-200 bg-background px-3 text-sm"
                  value={form.modeloCaminhao}
                  onChange={(e) => selecionarModelo(e.target.value)}
                >
                  {MODELOS_CAMINHAO.map((m) => (
                    <option key={m.nome} value={m.nome}>
                      {m.nome}
                      {m.consumoKmPorLitro != null
                        ? ` (~${m.consumoKmPorLitro} km/L)`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="apelido">Apelido / placa (opcional)</Label>
                  <Input
                    id="apelido"
                    placeholder="Ex: Cavalo 01, ABC-1D23"
                    value={form.apelidoVeiculo}
                    onChange={(e) => atualizar("apelidoVeiculo", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ano">Ano (opcional)</Label>
                  <Input
                    id="ano"
                    type="number"
                    min={1990}
                    max={2030}
                    value={form.anoVeiculo}
                    onChange={(e) => atualizar("anoVeiculo", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="px-6 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Route className="h-5 w-5 text-amber-600" />
                Frete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div>
                <Label htmlFor="precoKm">Preço por km (R$), ida e volta</Label>
                <Input
                  id="precoKm"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.precoKmFrete}
                  onChange={(e) => atualizar("precoKmFrete", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Usado em viagens e no assistente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="px-6 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Fuel className="h-5 w-5 text-amber-600" />
                Combustível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div>
                <Label htmlFor="consumo">Consumo (km/L)</Label>
                <Input
                  id="consumo"
                  type="number"
                  min={0.1}
                  step="0.1"
                  required
                  value={form.consumoKmPorLitro}
                  onChange={(e) => atualizar("consumoKmPorLitro", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="diesel">Diesel (R$/L)</Label>
                <Input
                  id="diesel"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.precoCombustivelLitro}
                  onChange={(e) => atualizar("precoCombustivelLitro", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {(erro || sucesso) && (
            <p
              className={cn(
                "text-sm sm:mr-auto",
                erro && "text-red-600",
                sucesso && "text-emerald-700"
              )}
              aria-live="polite"
            >
              {erro || sucesso}
            </p>
          )}
          <Button
            type="submit"
            disabled={salvando}
            className="min-w-[180px] bg-amber-500 text-white shadow-md hover:bg-amber-600"
          >
            {salvando ? (
              "Salvando..."
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
