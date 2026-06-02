import { moeda } from "@/lib/format";

function mediaReaisPorKm(kmIdaVolta: number) {
  if (kmIdaVolta > 2000) return 0.22;
  if (kmIdaVolta > 800) return 0.2;
  return 0.18;
}

export type EstimativaPedagio = {
  valor: number;
  reaisPorKm: number;
  observacao: string;
  fonte: "ia" | "media";
};

export function pedagioMediaPorDistancia(kmIdaVolta: number): EstimativaPedagio {
  const reaisPorKm = mediaReaisPorKm(kmIdaVolta);
  const valor = Math.round(kmIdaVolta * reaisPorKm * 100) / 100;

  return {
    valor,
    reaisPorKm,
    observacao:
      `Média aproximada **R$ ${reaisPorKm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/km** ` +
      `(ida e volta, total ${moeda(valor)}). Pode variar — confirme no QualP antes de viajar.`,
    fonte: "media",
  };
}

function extrairValorPedagio(texto: string): number | null {
  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]) as {
        pedagioIdaVolta?: number | null;
        pedagio?: number | null;
        valor?: number | null;
      };
      const v = obj.pedagioIdaVolta ?? obj.pedagio ?? obj.valor;
      if (v != null && v > 0) return Math.round(v * 100) / 100;
    } catch {
      
    }
  }

  const numeros = texto.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d{2})?)/g);
  if (!numeros?.length) return null;

  const valores = numeros
    .map((n) => Number(n.replace(/\./g, "").replace(",", ".")))
    .filter((n) => n > 50 && n < 500_000);

  if (!valores.length) return null;

  return Math.max(...valores);
}

async function pedagioComIA(
  origem: string,
  destino: string,
  kmIda: number,
  kmIdaVolta: number
): Promise<EstimativaPedagio | null> {
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
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Você estima pedágios de caminhão no Brasil. Sempre informe um valor em reais, mesmo que aproximado.",
        },
        {
          role: "user",
          content: `Estime o pedágio TOTAL ida e volta para caminhão (eixo duplo / carreta) entre:
Origem: ${origem}
Destino: ${destino}
${kmIda} km (ida), ${kmIdaVolta} km (ida e volta).

Responda APENAS este JSON (pedagioIdaVolta obrigatório, número positivo):
{"pedagioIdaVolta": 1200.50, "observacao": "BR-381, BR-050 e trechos MT"}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const dados = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const texto = dados.choices?.[0]?.message?.content ?? "";
  const valor = extrairValorPedagio(texto);
  if (valor == null) return null;

  const obsMatch = texto.match(/"observacao"\s*:\s*"([^"]+)"/);
  const obsExtra = obsMatch?.[1]?.trim();

  return {
    valor,
    reaisPorKm: Math.round((valor / kmIdaVolta) * 1000) / 1000,
    observacao:
      `Estimativa para esta rota: **${moeda(valor)}** (ida e volta).` +
      (obsExtra ? ` _${obsExtra}_` : "") +
      " Valor aproximado — confirme em QualP ou Sem Parar.",
    fonte: "ia",
  };
}

export async function estimarPedagioRota(
  origem: string,
  destino: string,
  kmIda: number,
  kmIdaVolta: number
): Promise<EstimativaPedagio> {
  const ia = await pedagioComIA(origem, destino, kmIda, kmIdaVolta);
  if (ia) return ia;

  return pedagioMediaPorDistancia(kmIdaVolta);
}

export function perguntaMencionaPedagio(pergunta: string) {
  const t = pergunta.toLowerCase();
  return /ped[aá]gio|praça|sem parar|veloe|qualp/.test(t);
}
