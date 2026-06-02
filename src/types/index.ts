export interface ListarViagem {
  id: number;
  origem: string;
  destino: string;
  dataSaida: string;
  dataChegada: string | null;
  kmInicial: number;
  kmFinal: number;
  kmRodados: number;
  valorFrete: number;
  observacao: string | null;
  totalCustos: number;
  lucroLiquido: number;
  custoPorKm: number | null;
  lucroPorKm: number | null;
  percentualLucro: number | null;
}

export interface RegistrarViagem {
  origem: string;
  destino: string;
  dataSaida: string;
  dataChegada?: string | null;
  kmInicial: number;
  kmFinal: number;
  valorFrete: number;
  observacao?: string | null;
}

export interface ResumoViagem {
  viagemId: number;
  origem: string;
  destino: string;
  kmRodados: number;
  valorFrete: number;
  totalCustos: number;
  lucroLiquido: number;
  custoPorKm: number | null;
  lucroPorKm: number | null;
  percentualLucro: number | null;
}

export interface ListarCusto {
  id: number;
  viagemId: number;
  categoriaCustoId: number;
  categoriaNome: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface RegistrarCusto {
  categoriaCustoId: number;
  descricao: string;
  valor: number;
  data: string;
}

export interface ListarCategoria {
  id: number;
  nome: string;
}

export interface ViagemResumoRelatorio {
  id: number;
  origem: string;
  destino: string;
  lucroLiquido: number;
}

export interface ConfiguracaoPerfil {
  id: number;
  modeloCaminhao: string;
  apelidoVeiculo: string | null;
  anoVeiculo: number | null;
  precoKmFrete: number;
  consumoKmPorLitro: number;
  precoCombustivelLitro: number;
  alimentacaoAte200Km: number;
  alimentacaoAte400Km: number;
  alimentacaoAcima400Km: number;
  dataAtualizacao: string;
}

export interface SalvarConfiguracaoPerfil {
  modeloCaminhao: string;
  apelidoVeiculo: string | null;
  anoVeiculo: number | null;
  precoKmFrete: number;
  consumoKmPorLitro: number;
  precoCombustivelLitro: number;
}

export interface RelatorioMensal {
  ano: number;
  mes: number;
  totalRecebido: number;
  totalGasto: number;
  lucroTotal: number;
  totalKmRodados: number;
  mediaLucroPorKm: number | null;
  quantidadeViagens: number;
  viagemMaisLucrativa: ViagemResumoRelatorio | null;
  viagemMenosLucrativa: ViagemResumoRelatorio | null;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResposta {
  token: string;
  usuario: Usuario;
}
