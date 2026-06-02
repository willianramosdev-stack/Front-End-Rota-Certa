import { fetchJson } from "@/lib/api-base";

export type PontoMapa = {
  lat: number;
  lon: number;
  label: string;
};

export type DadosRota = {
  km: number;
  kmIda: number;
  origem: PontoMapa;
  destino: PontoMapa;
  trilha: [number, number][];
};

export function cidadeValida(slug: string) {
  return /^.+-[a-z]{2}$/i.test(slug.trim());
}

export async function buscarRota(
  origem: string,
  destino: string,
  signal?: AbortSignal
): Promise<DadosRota> {
  const dados = await fetchJson<DadosRota & { erro?: string }>("/api/distancia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origem, destino }),
    signal,
  });

  if (!dados.km || !dados.origem || !dados.destino) {
    throw new Error("Rota não retornada.");
  }

  return {
    km: dados.km,
    kmIda: dados.kmIda,
    origem: dados.origem,
    destino: dados.destino,
    trilha: dados.trilha ?? [
      [dados.origem.lat, dados.origem.lon],
      [dados.destino.lat, dados.destino.lon],
    ],
  };
}
