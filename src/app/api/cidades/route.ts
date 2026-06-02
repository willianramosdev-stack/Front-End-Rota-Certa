import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MunicipioIbge = {
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: { sigla: string };
    };
  } | null;
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: { sigla: string };
    };
  };
};

type CidadeSugestao = {
  label: string;
  nome: string;
  uf: string;
};

let municipiosCache: MunicipioIbge[] | null = null;

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function formatarSlug(nome: string, uf: string) {
  return `${semAcento(nome).toLowerCase().replace(/\s+/g, "-")}-${uf.toLowerCase()}`;
}

function obterUf(m: MunicipioIbge): string | null {
  return (
    m.microrregiao?.mesorregiao?.UF?.sigla ??
    m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
    null
  );
}

async function carregarMunicipios() {
  if (municipiosCache) return municipiosCache;

  const res = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    { cache: "force-cache" }
  );

  if (!res.ok) {
    throw new Error("Não foi possível carregar cidades do IBGE.");
  }

  municipiosCache = (await res.json()) as MunicipioIbge[];
  return municipiosCache;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const municipios = await carregarMunicipios();
    const busca = semAcento(q).toLowerCase();
    const lista: CidadeSugestao[] = [];

    for (const m of municipios) {
      const uf = obterUf(m);
      if (!uf) continue;

      const slug = formatarSlug(m.nome, uf);
      const nomeBusca = semAcento(m.nome).toLowerCase();

      if (slug.includes(busca) || nomeBusca.includes(busca)) {
        lista.push({ label: slug, nome: m.nome, uf });
      }

      if (lista.length >= 12) break;
    }

    return NextResponse.json(lista);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar cidades.";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
