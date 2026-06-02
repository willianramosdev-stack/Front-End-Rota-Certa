import { extrairMensagemErro, parseJson, urlApi } from "@/lib/api-base";
import type { AuthResposta, Usuario } from "@/types";

const TOKEN_KEY = "rotacerta_token";
const USUARIO_KEY = "rotacerta_usuario";

export function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function obterUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function estaAutenticado(): boolean {
  return !!obterToken();
}

function salvarSessao(resposta: AuthResposta) {
  localStorage.setItem(TOKEN_KEY, resposta.token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(resposta.usuario));
}

export async function login(email: string, senha: string): Promise<AuthResposta> {
  const res = await fetch(urlApi("/api/Auth/Login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const texto = await res.text();

  if (!res.ok) {
    throw new Error(extrairMensagemErro(texto, res.status));
  }

  const dados = parseJson<AuthResposta>(texto);
  salvarSessao(dados);
  return dados;
}

export async function registrar(
  nome: string,
  email: string,
  senha: string
): Promise<AuthResposta> {
  const res = await fetch(urlApi("/api/Auth/Registrar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  const texto = await res.text();

  if (!res.ok) {
    throw new Error(extrairMensagemErro(texto, res.status));
  }

  const dados = parseJson<AuthResposta>(texto);
  salvarSessao(dados);
  return dados;
}

export async function logout(): Promise<void> {
  const token = obterToken();

  if (token) {
    try {
      await fetch(urlApi("/api/Auth/Logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {

    }
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

export function cabecalhoAuth(): Record<string, string> {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
