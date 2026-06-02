export type CidadesExtraidas = {
  origem: string;
  destino: string;
  precoKm?: number;
};

const SLUG_CIDADE = /^[a-zà-ú0-9]+-[a-z]{2}$/;

function normalizarCidade(texto: string) {
  return texto.trim().toLowerCase().replace(/\s+/g, "-");
}

function ehSlugCidade(slug: string) {
  return SLUG_CIDADE.test(slug);
}

function limparPergunta(texto: string) {
  return texto
    .toLowerCase()
    .replace(/quanto\s+(recebo|ganho|pago|gasto|gastos|vou\s+gastar)\s+(de\s+)?/gi, "")
    .replace(/quanto\s+(é|e)\s+o\s+(frete|valor)\s+/gi, "")
    .replace(/valor\s+do\s+frete\s+/gi, "")
    .replace(/\bde\s+frete\s+de\s+/gi, "de ")
    .replace(/\bfrete\s+de\s+/gi, "de ")
    .replace(/\b(recebo|ganho|pago)\s+de\s+frete\s+/gi, "")
    .replace(/\b(frete|gastos?|viagem|rota|lucro)\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extrairPrecoKm(texto: string): number | undefined {
  const match = texto.match(
    /(\d+[,.]?\d*)\s*(?:reais|r\$)?\s*(?:o|por)?\s*km/i
  );
  if (!match) return undefined;
  return Number(match[1].replace(",", "."));
}

export function extrairCidades(texto: string): CidadesExtraidas | null {
  const precoKm = extrairPrecoKm(texto);
  const limpo = limparPergunta(texto);

  const parSlug = limpo.match(
    /([a-zà-ú0-9]+-[a-z]{2})\s+(?:até|ate|para|pra|a|->|→)\s+([a-zà-ú0-9]+-[a-z]{2})/i
  );

  if (parSlug) {
    const origem = normalizarCidade(parSlug[1]);
    const destino = normalizarCidade(parSlug[2]);
    if (ehSlugCidade(origem) && ehSlugCidade(destino) && origem !== destino) {
      return { origem, destino, precoKm };
    }
  }

  const padroes = [
    /(?:de|saindo de|partindo de)\s+([a-zà-ú0-9]+-[a-z]{2})\s+(?:até|ate|para|pra|a)\s+([a-zà-ú0-9]+-[a-z]{2})/i,
    /([a-zà-ú0-9]+-[a-z]{2})\s+(?:até|ate|para|pra|->|→)\s+([a-zà-ú0-9]+-[a-z]{2})/i,
  ];

  for (const re of padroes) {
    const m = limpo.match(re);
    if (!m) continue;

    const origem = normalizarCidade(m[1]);
    const destino = normalizarCidade(m[2]);

    if (ehSlugCidade(origem) && ehSlugCidade(destino) && origem !== destino) {
      return { origem, destino, precoKm };
    }
  }

  const slugs: string[] = [];
  const reSlug = /([a-zà-ú0-9]+-[a-z]{2})\b/gi;
  let matchSlug: RegExpExecArray | null;
  while ((matchSlug = reSlug.exec(limpo)) !== null) {
    const slug = normalizarCidade(matchSlug[1]);
    if (ehSlugCidade(slug) && !slugs.includes(slug)) slugs.push(slug);
  }

  if (slugs.length >= 2) {
    return { origem: slugs[0], destino: slugs[1], precoKm };
  }

  return null;
}

export function validarCidadesExtraidas(
  cidades: CidadesExtraidas | null
): CidadesExtraidas | null {
  if (!cidades) return null;
  if (
    !ehSlugCidade(cidades.origem) ||
    !ehSlugCidade(cidades.destino) ||
    cidades.origem === cidades.destino
  ) {
    return null;
  }
  return cidades;
}
