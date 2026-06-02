import type { ConfiguracaoPerfil } from "@/types";

export const MODELOS_CAMINHAO = [
  { nome: "Scania R 440", consumoKmPorLitro: 2.9 },
  { nome: "Volvo FH", consumoKmPorLitro: 2.8 },
  { nome: "Mercedes Actros", consumoKmPorLitro: 2.7 },
  { nome: "Iveco Stralis", consumoKmPorLitro: 2.6 },
  { nome: "DAF XF", consumoKmPorLitro: 2.75 },
  { nome: "Personalizado", consumoKmPorLitro: null },
] as const;

export const CONFIGURACAO_PADRAO: ConfiguracaoPerfil = {
  id: 1,
  modeloCaminhao: "Volvo FH",
  apelidoVeiculo: null,
  anoVeiculo: null,
  precoKmFrete: 3.5,
  consumoKmPorLitro: 2.8,
  precoCombustivelLitro: 6.2,
  alimentacaoAte200Km: 30,
  alimentacaoAte400Km: 50,
  alimentacaoAcima400Km: 80,
  dataAtualizacao: "",
};

export function consumoDoModelo(nomeModelo: string): number | null {
  const modelo = MODELOS_CAMINHAO.find((m) => m.nome === nomeModelo);
  return modelo?.consumoKmPorLitro ?? null;
}
