import { NextRequest, NextResponse } from "next/server";

import { buscarRotaMapa } from "@/lib/rota-servidor";

export const dynamic = "force-dynamic";

type Corpo = {
  origem?: string;
  destino?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Corpo;
    const origem = body.origem?.trim();
    const destino = body.destino?.trim();

    if (!origem || !destino) {
      return NextResponse.json(
        { erro: "Informe origem e destino." },
        { status: 400 }
      );
    }

    const rota = await buscarRotaMapa(origem, destino, req.signal);

    return NextResponse.json({
      km: rota.kmIdaVolta,
      kmIda: rota.kmIda,
      tipo: "estrada-ida-volta",
      origem: rota.origem,
      destino: rota.destino,
      trilha: rota.trilha,
      origemMapa: rota.origem.label,
      destinoMapa: rota.destino.label,
    });
  } catch (e) {
    if (req.signal.aborted) {
      return NextResponse.json({ erro: "Consulta cancelada." }, { status: 499 });
    }

    const msg = e instanceof Error ? e.message : "Erro ao calcular distância.";
    return NextResponse.json({ erro: msg }, { status: 422 });
  }
}
