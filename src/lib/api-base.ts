/** URL base da API .NET — no browser usa proxy /backend; no servidor usa URL direta. */
export function baseApi(): string {
  if (typeof window !== "undefined") {
    return "/backend";
  }

  return process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5260";
}

export function urlApi(caminho: string): string {
  const base = baseApi().replace(/\/$/, "");
  const path = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${base}${path}`;
}

export function extrairMensagemErro(texto: string, status: number): string {
  const t = texto.trim();

  if (!t) {
    return `Erro na requisição (${status}).`;
  }

  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const json = JSON.parse(t) as {
        title?: string;
        errors?: Record<string, string[]>;
        mensagem?: string;
        erro?: string;
      };

      if (json.erro) return json.erro;

      if (json.errors) {
        const msgs = Object.values(json.errors).flat();
        if (msgs.length) return msgs.join(" ");
      }

      if (json.mensagem) return json.mensagem;

      if (json.title && json.title !== "One or more validation errors occurred.") {
        return json.title;
      }
    } catch {

    }
  }

  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html") || t.startsWith("<")) {
    if (status === 500) {
      return "Serviço Indisponivel no Momento! Tente novamente em alguns minutos.";
    }
    return "Serviço indisponível.";
  }

  return t;
}

export function parseJson<T>(texto: string): T {
  const t = texto.trim();

  if (!t) {
    throw new Error("Resposta vazia da API.");
  }

  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html") || t.startsWith("<")) {
    throw new Error(
      "Serviço indisponível."
    );
  }

  try {
    return JSON.parse(t) as T;
  } catch {
    throw new Error("Resposta inválida da API (esperava JSON).");
  }
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  const texto = await res.text();

  if (!res.ok) {
    throw new Error(extrairMensagemErro(texto, res.status));
  }

  if (!texto.trim()) {
    return undefined as T;
  }

  return parseJson<T>(texto);
}
