export function moeda(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function data(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR");
}

export function dataParaApi(valor: string) {
  return `${valor}T12:00:00`;
}

export function dataDoInput(valor: string | null | undefined) {
  if (!valor) return "";
  return valor.slice(0, 10);
}

export function formatarCidade(slug: string) {
  const limpo = slug.trim();
  const match = limpo.match(/^(.+)-([a-z]{2})$/i);

  if (!match) return limpo;

  const nome = match[1]
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  return `${nome}/${match[2].toUpperCase()}`;
}
