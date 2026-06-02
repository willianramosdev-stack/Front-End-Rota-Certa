import { moeda } from "@/lib/format";
import type { ConfiguracaoPerfil } from "@/types";

export type ParametrosEstimativa = {
  precoKmFrete: number;
  consumoKmPorLitro: number;
  precoCombustivelLitro: number;
  modeloCaminhao?: string;
};

export const PARAMETROS_ESTIMATIVA_PADRAO: ParametrosEstimativa = {
  precoKmFrete: 3.5,
  consumoKmPorLitro: 2.8,
  precoCombustivelLitro: 6.2,
  modeloCaminhao: "Volvo FH",
};

export type EstimativaViagem = {
  origem: string;
  destino: string;
  kmIda: number;
  kmIdaVolta: number;
  precoKmFrete: number;
  combustivel: number;
  frete: number;
  lucroEstimado: number;
  modeloCaminhao?: string;
};

export function configuracaoParaParametros(
  config: ConfiguracaoPerfil
): ParametrosEstimativa {
  return {
    precoKmFrete: config.precoKmFrete,
    consumoKmPorLitro: config.consumoKmPorLitro,
    precoCombustivelLitro: config.precoCombustivelLitro,
    modeloCaminhao: config.modeloCaminhao,
  };
}

export function calcularEstimativa(
  origem: string,
  destino: string,
  kmIda: number,
  kmIdaVolta: number,
  precoKmFrete?: number,
  params: ParametrosEstimativa = PARAMETROS_ESTIMATIVA_PADRAO
): EstimativaViagem {
  const precoKm = precoKmFrete ?? params.precoKmFrete;
  const combustivel =
    (kmIdaVolta / params.consumoKmPorLitro) * params.precoCombustivelLitro;
  const frete = kmIdaVolta * precoKm;
  const lucroEstimado = frete - combustivel;

  return {
    origem,
    destino,
    kmIda,
    kmIdaVolta,
    precoKmFrete: precoKm,
    combustivel: Math.round(combustivel * 100) / 100,
    frete: Math.round(frete * 100) / 100,
    lucroEstimado: Math.round(lucroEstimado * 100) / 100,
    modeloCaminhao: params.modeloCaminhao,
  };
}

export function textoEstimativa(e: EstimativaViagem): string {
  const precoKmTexto = e.precoKmFrete.toLocaleString("pt-BR");
  const linhaVeiculo = e.modeloCaminhao
    ? `Veículo: **${e.modeloCaminhao}** (suas configurações salvas)`
    : "";

  const linhaLucro =
    e.lucroEstimado >= 0
      ? `Lucro estimado: **${moeda(e.lucroEstimado)}** (descontando só combustível)`
      : `Atenção: prejuízo estimado de **${moeda(Math.abs(e.lucroEstimado))}** (descontando só combustível).`;

  return [
    `Rota: **${e.origem}** → **${e.destino}**`,
    `Distância: **${e.kmIda} km** (ida), **${e.kmIdaVolta} km** ida e volta (estradas)`,
    linhaVeiculo,
    "**Gastos estimados**",
    `Combustível: **${moeda(e.combustivel)}**`,
    "",
    "**Receita**",
    `Frete (${precoKmTexto}/km, ida e volta): **${moeda(e.frete)}**`,
    "",
    linhaLucro,
    "",
    "Pedágio e alimentação você registra depois em Gastos na viagem.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function precoKmPadrao(params = PARAMETROS_ESTIMATIVA_PADRAO) {
  return params.precoKmFrete;
}
