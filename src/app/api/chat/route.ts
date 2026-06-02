import { NextRequest, NextResponse } from "next/server";

import {
  extrairCidades,
  extrairPrecoKm,
  validarCidadesExtraidas,
} from "@/lib/extrair-pergunta";
import { parametrosEstimativaServidor } from "@/lib/configuracao-servidor";
import { calcularEstimativa, textoEstimativa } from "@/lib/estimativa";
import { calcularDistanciaIdaVolta } from "@/lib/rota-servidor";

async function extrairComIA(pergunta: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-001";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "RotaLucro",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `Extraia origem e destino de cidades brasileiras no formato slug (cidade-uf).
Ignore palavras como frete, gasto, recebo, lucro — não fazem parte do nome da cidade.
Exemplo: "quanto recebo de frete de alterosa-mg até uberaba-mg" → origem alterosa-mg, destino uberaba-mg.
Pergunta: "${pergunta}"
Responda SOMENTE JSON: {"origem":"alfenas-mg","destino":"curitiba-pr","precoKm":3.5}
Se não souber precoKm use null. Se não achar cidades use null nos campos.`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const dados = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const texto = dados.choices?.[0]?.message?.content ?? "";
  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const obj = JSON.parse(jsonMatch[0]) as {
      origem?: string | null;
      destino?: string | null;
      precoKm?: number | null;
    };
    if (!obj.origem || !obj.destino) return null;
    return {
      origem: obj.origem,
      destino: obj.destino,
      precoKm: obj.precoKm ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { message?: string };
  const pergunta = body.message?.trim() ?? "";
  const authorization = req.headers.get("authorization");

  if (!pergunta) {
    return NextResponse.json({ erro: "Digite uma pergunta." }, { status: 400 });
  }

  const perguntaLower = pergunta.toLowerCase();

  if (
    perguntaLower.includes("ajuda") ||
    perguntaLower.includes("como usar") ||
    perguntaLower === "oi" ||
    perguntaLower === "olá"
  ) {
    return NextResponse.json({
      resposta:
        "Olá! Pergunte sobre uma viagem, por exemplo:\n\n" +
        '• "Quanto vou gastar de Alfenas-mg até Curitiba-pr?"\n' +
        '• "De São Paulo-SP para Belo Horizonte-MG a 4 reais o km"\n\n' +
        "Eu calculo distância por estrada (ida e volta), combustível, frete e lucro. Pedágio e alimentação você lança em Gastos na viagem.",
    });
  }

  let cidades = validarCidadesExtraidas(extrairCidades(pergunta));
  if (!cidades) {
    cidades = validarCidadesExtraidas(await extrairComIA(pergunta));
  }

  if (!cidades) {
    return NextResponse.json({
      resposta:
        "Não entendi as cidades. Use o formato:\n\n" +
        '**"Quanto gasto de alfenas-mg até curitiba-pr?"**\n' +
        '**"Quanto recebo de frete de alterosa-mg até uberaba-mg?"**',
    });
  }

  const parametros = await parametrosEstimativaServidor(authorization);

  const precoKm =
    cidades.precoKm ?? extrairPrecoKm(pergunta) ?? parametros.precoKmFrete;

  try {
    const rota = await calcularDistanciaIdaVolta(
      cidades.origem,
      cidades.destino
    );

    const estimativa = calcularEstimativa(
      cidades.origem,
      cidades.destino,
      rota.kmIda,
      rota.kmIdaVolta,
      precoKm,
      parametros
    );

    return NextResponse.json({
      resposta: textoEstimativa(estimativa),
      estimativa,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao calcular.";
    return NextResponse.json({
      resposta: `Não consegui calcular: ${msg}\n\nConfira se as cidades estão no formato **cidade-uf** (ex: Alfenas-MG).`,
    });
  }
}
