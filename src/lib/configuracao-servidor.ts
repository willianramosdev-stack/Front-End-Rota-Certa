import { urlApi } from "@/lib/api-base";
import { CONFIGURACAO_PADRAO } from "@/lib/configuracao";
import { configuracaoParaParametros } from "@/lib/estimativa";
import type { ConfiguracaoPerfil } from "@/types";

export async function buscarConfiguracaoServidor(
  authorization?: string | null
): Promise<ConfiguracaoPerfil> {
  try {
    const headers: Record<string, string> = {};
    if (authorization) {
      headers.Authorization = authorization;
    }

    const res = await fetch(urlApi("/api/ConfiguracaoPerfil/Obter"), {
      cache: "no-store",
      headers,
    });

    if (!res.ok) return CONFIGURACAO_PADRAO;

    return (await res.json()) as ConfiguracaoPerfil;
  } catch {
    return CONFIGURACAO_PADRAO;
  }
}

export async function parametrosEstimativaServidor(authorization?: string | null) {
  const config = await buscarConfiguracaoServidor(authorization);
  return configuracaoParaParametros(config);
}
