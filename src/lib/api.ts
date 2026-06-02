import { extrairMensagemErro, parseJson, urlApi } from "@/lib/api-base";
import { cabecalhoAuth, logout, obterToken } from "@/lib/auth";
import type {
  ConfiguracaoPerfil,
  SalvarConfiguracaoPerfil,
  ListarCategoria,
  ListarCusto,
  ListarViagem,
  RegistrarCusto,
  RegistrarViagem,
  RelatorioMensal,
  ResumoViagem,
} from "@/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(urlApi(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...cabecalhoAuth(),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const texto = await res.text();

  if (!res.ok) {
    throw new Error(extrairMensagemErro(texto, res.status));
  }

  if (!texto.trim()) {
    return undefined as T;
  }

  return parseJson<T>(texto);
}


export function listarViagens() {
  return request<ListarViagem[]>("/api/Viagens/ListarViagens");
}

export function buscarViagem(id: number) {
  return request<ListarViagem>(`/api/Viagens/ListarViagemPorId/${id}`);
}

export function buscarResumoViagem(id: number) {
  return request<ResumoViagem>(`/api/Viagens/ResumoViagem/${id}`);
}

export function criarViagem(dados: RegistrarViagem) {
  return request<void>("/api/Viagens/RegistrarViagem", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarViagem(dados: ListarViagem) {
  return request<void>("/api/Viagens/AtualizarViagem", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function excluirViagem(id: number) {
  return request<void>(`/api/Viagens/DeletarViagem/${id}`, { method: "DELETE" });
}

export function listarCustos(viagemId: number) {
  return request<ListarCusto[]>(
    `/api/CustosViagem/ListarCustosPorViagem/${viagemId}`
  );
}

export function criarCusto(viagemId: number, dados: RegistrarCusto) {
  return request<void>(`/api/CustosViagem/RegistrarCusto/${viagemId}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function excluirCusto(id: number) {
  return request<void>(`/api/CustosViagem/DeletarCusto/${id}`, {
    method: "DELETE",
  });
}

export function listarCategorias() {
  return request<ListarCategoria[]>("/api/CategoriasCusto/ListarCategorias");
}

export function buscarRelatorio(ano: number, mes: number) {
  return request<RelatorioMensal>(
    `/api/Relatorios/RelatorioMensal?ano=${ano}&mes=${mes}`
  );
}

export function buscarConfiguracao() {
  return request<ConfiguracaoPerfil>("/api/ConfiguracaoPerfil/Obter");
}

export function salvarConfiguracao(dados: SalvarConfiguracaoPerfil) {
  return request<ConfiguracaoPerfil>("/api/ConfiguracaoPerfil/Salvar", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export { obterToken };
