export type PontoMapa = {
  lat: number;
  lon: number;
  label: string;
};

export type RotaMapaCompleta = {
  kmIda: number;
  kmIdaVolta: number;
  origem: PontoMapa;
  destino: PontoMapa;
  trilha: [number, number][];
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    state?: string;
    country?: string;
  };
};

type OsrmRoute = {
  code?: string;
  routes?: {
    distance: number;
    geometry?: { coordinates: [number, number][] };
  }[];
};

const coordCache = new Map<string, PontoMapa>();
let nominatimFila: Promise<void> = Promise.resolve();
let ultimoNominatimMs = 0;

const FETCH_TIMEOUT_MS = 20_000;
const NOMINATIM_INTERVALO_MS = 1_100;

function parseCidade(slug: string) {
  const limpo = slug.trim().toLowerCase();
  const match = limpo.match(/^(.+)-([a-z]{2})$/);

  if (match) {
    const nome = match[1]
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { nome, uf: match[2].toUpperCase(), slug: limpo };
  }

  return { nome: limpo, uf: "", slug: limpo };
}

function mensagemErroRede(erro: unknown, servico: string): Error {
  if (erro instanceof Error) {
    const msg = erro.message.toLowerCase();

    if (
      erro.name === "AbortError" ||
      msg.includes("aborted") ||
      msg.includes("abort")
    ) {
      return new Error("Consulta cancelada.");
    }

    if (
      erro.name === "TimeoutError" ||
      msg.includes("timeout") ||
      msg.includes("timed out")
    ) {
      return new Error(`${servico} demorou demais. Tente novamente.`);
    }

    if (msg === "fetch failed" || erro.name === "TypeError") {
      return new Error(
        `Sem conexão com ${servico}. Verifique sua internet e tente de novo.`
      );
    }

    return erro;
  }

  return new Error(`Erro ao consultar ${servico}.`);
}

async function fetchComRetry(
  url: string,
  init?: RequestInit,
  tentativas = 3
): Promise<Response> {
  let ultimoErro: unknown;

  for (let i = 0; i < tentativas; i++) {
    try {
      const signal =
        init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS);

      return await fetch(url, {
        ...init,
        signal,
      });
    } catch (erro) {
      ultimoErro = erro;

      if (init?.signal?.aborted) {
        throw erro;
      }

      if (i < tentativas - 1) {
        await new Promise((resolve) => setTimeout(resolve, 700 * (i + 1)));
      }
    }
  }

  throw mensagemErroRede(ultimoErro, "o serviço de mapas");
}

async function aguardarVezNominatim() {
  const espera = Math.max(0, NOMINATIM_INTERVALO_MS - (Date.now() - ultimoNominatimMs));
  if (espera > 0) {
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
  ultimoNominatimMs = Date.now();
}

async function enfileirarNominatim<T>(fn: () => Promise<T>): Promise<T> {
  const tarefa = nominatimFila.then(async () => {
    await aguardarVezNominatim();
    return fn();
  });

  nominatimFila = tarefa.then(
    () => undefined,
    () => undefined
  );

  return tarefa;
}

async function buscarCoordenadasNominatim(
  consulta: string,
  signal?: AbortSignal
): Promise<PontoMapa | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(consulta)}&format=json&limit=1&countrycodes=br`;

  const res = await enfileirarNominatim(() =>
    fetchComRetry(url, {
      signal,
      headers: {
        "User-Agent": "RotaCerta/1.0 (contato@estudo.local)",
        "Accept-Language": "pt-BR",
      },
    })
  );

  if (!res.ok) {
    return null;
  }

  const lista = (await res.json()) as NominatimResult[];
  const item = lista[0];

  if (!item) {
    return null;
  }

  return {
    lat: Number(item.lat),
    lon: Number(item.lon),
    label: item.display_name ?? consulta,
  };
}

async function buscarCoordenadasPhoton(
  consulta: string,
  signal?: AbortSignal
): Promise<PontoMapa | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(consulta)}&limit=1&lang=pt`;

  const res = await fetchComRetry(url, { signal });

  if (!res.ok) {
    return null;
  }

  const dados = (await res.json()) as { features?: PhotonFeature[] };
  const feature = dados.features?.[0];
  const coords = feature?.geometry?.coordinates;

  if (!coords) {
    return null;
  }

  const [lon, lat] = coords;
  const props = feature.properties;
  const label = [props?.name, props?.state, props?.country]
    .filter(Boolean)
    .join(", ");

  return {
    lat,
    lon,
    label: label || consulta,
  };
}

async function buscarCoordenadas(
  cidadeSlug: string,
  signal?: AbortSignal
): Promise<PontoMapa> {
  const slug = cidadeSlug.trim().toLowerCase();
  const emCache = coordCache.get(slug);

  if (emCache) {
    return emCache;
  }

  const { nome, uf } = parseCidade(slug);
  const consulta = uf ? `${nome}, ${uf}, Brasil` : `${nome}, Brasil`;

  const ponto =
    (await buscarCoordenadasNominatim(consulta, signal)) ??
    (await buscarCoordenadasPhoton(consulta, signal));

  if (!ponto) {
    throw new Error(
      `Cidade não encontrada: ${cidadeSlug}. Use o formato cidade-uf (ex: alfenas-mg).`
    );
  }

  coordCache.set(slug, ponto);
  return ponto;
}

async function rotaComGeometria(
  origem: PontoMapa,
  destino: PontoMapa,
  signal?: AbortSignal
): Promise<{ kmIda: number; trilha: [number, number][] }> {
  const coords = `${origem.lon},${origem.lat};${destino.lon},${destino.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetchComRetry(url, { signal });

  if (!res.ok) {
    throw new Error("Erro ao calcular rota nas estradas.");
  }

  const dados = (await res.json()) as OsrmRoute;
  const rota = dados.routes?.[0];

  if (dados.code !== "Ok" || !rota) {
    throw new Error("Não foi possível traçar rota entre essas cidades.");
  }

  const trilha: [number, number][] =
    rota.geometry?.coordinates.map(([lon, lat]) => [lat, lon]) ?? [
      [origem.lat, origem.lon],
      [destino.lat, destino.lon],
    ];

  return {
    kmIda: Math.round(rota.distance / 1000),
    trilha,
  };
}

export async function buscarRotaMapa(
  origemSlug: string,
  destinoSlug: string,
  signal?: AbortSignal
): Promise<RotaMapaCompleta> {
  if (origemSlug.trim().toLowerCase() === destinoSlug.trim().toLowerCase()) {
    throw new Error("Origem e destino são iguais.");
  }

  try {
    const origem = await buscarCoordenadas(origemSlug, signal);
    const destino = await buscarCoordenadas(destinoSlug, signal);
    const { kmIda, trilha } = await rotaComGeometria(origem, destino, signal);

    return {
      kmIda,
      kmIdaVolta: kmIda * 2,
      origem,
      destino,
      trilha,
    };
  } catch (erro) {
    if (signal?.aborted) {
      throw new Error("Consulta cancelada.");
    }

    if (erro instanceof Error) {
      throw erro;
    }

    throw mensagemErroRede(erro, "o serviço de mapas");
  }
}

export async function calcularDistanciaIdaVolta(
  origem: string,
  destino: string,
  signal?: AbortSignal
) {
  const rota = await buscarRotaMapa(origem, destino, signal);

  return {
    kmIda: rota.kmIda,
    kmIdaVolta: rota.kmIdaVolta,
    origemMapa: rota.origem.label,
    destinoMapa: rota.destino.label,
  };
}
