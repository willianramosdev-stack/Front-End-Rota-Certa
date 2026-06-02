"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { TextoResposta } from "@/components/texto-resposta";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { extrairMensagemErro, parseJson } from "@/lib/api-base";
import { cabecalhoAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mensagem = {
  id: string;
  papel: "usuario" | "assistente";
  texto: string;
};

const SUGESTOES = [
  "Quanto vou gastar de alfenas-mg até curitiba-pr?",
  "De são paulo-sp para belo horizonte-mg a 4 reais o km",
  "Quanto recebo de frete de alterosa-mg até uberaba-mg?",
];

const TIMEOUT_MS = 90_000;

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: "0",
      papel: "assistente",
      texto:
        "Olá! Pergunte sobre uma rota e eu estimo combustível, frete e lucro.\n\nExemplo: \"Quanto gasto de alfenas-mg até curitiba-pr?\"",
    },
  ]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  function rolarParaFim() {
    requestAnimationFrame(() => {
      fimRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function enviar(texto?: string) {
    const pergunta = (texto ?? entrada).trim();
    if (!pergunta) {
      setErroForm("Digite uma pergunta ou toque em uma sugestão abaixo.");
      return;
    }
    if (enviando) return;

    setErroForm("");
    const idUsuario = `${Date.now()}-u`;
    setMensagens((prev) => [
      ...prev,
      { id: idUsuario, papel: "usuario", texto: pergunta },
    ]);
    setEntrada("");
    setEnviando(true);
    rolarParaFim();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...cabecalhoAuth(),
        },
        body: JSON.stringify({ message: pergunta }),
        signal: controller.signal,
      });

      const texto = await res.text();

      if (!res.ok) {
        throw new Error(extrairMensagemErro(texto, res.status));
      }

      const dados = parseJson<{ resposta?: string; erro?: string }>(texto);

      const resposta =
        dados.resposta ?? dados.erro ?? "Não foi possível obter resposta.";

      setMensagens((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          papel: "assistente",
          texto: resposta,
        },
      ]);
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "A consulta demorou demais. Tente de novo ou use cidades no formato cidade-uf."
          : e instanceof Error
            ? e.message
            : "Erro de conexão. Tente novamente.";

      setMensagens((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          papel: "assistente",
          texto: msg,
        },
      ]);
    } finally {
      clearTimeout(timer);
      setEnviando(false);
      rolarParaFim();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Assistente de viagem</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Estime combustível, frete e lucro antes de cadastrar a viagem.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-amber-200/80 shadow-md">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.papel === "usuario" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%]",
                    msg.papel === "usuario"
                      ? "bg-amber-500 text-white"
                      : "border border-amber-100 bg-amber-50/80 text-foreground"
                  )}
                >
                  {msg.papel === "assistente" && (
                    <Sparkles className="mb-2 h-4 w-4 text-amber-600" />
                  )}
                  {msg.papel === "usuario" ? (
                    <p className="text-sm leading-relaxed">{msg.texto}</p>
                  ) : (
                    <TextoResposta texto={msg.texto} />
                  )}
                </div>
              </div>
            ))}

            {enviando && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculando rota e estimativas...
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <div className="shrink-0 border-t border-amber-100 bg-background p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={enviando}
                  onClick={() => void enviar(s)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-xs text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {erroForm && (
              <p className="mb-2 text-sm text-red-600" role="alert">
                {erroForm}
              </p>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void enviar();
              }}
            >
              <Textarea
                value={entrada}
                onChange={(e) => {
                  setEntrada(e.target.value);
                  if (erroForm) setErroForm("");
                }}
                placeholder="Ex: Quanto gasto de alfenas-mg até curitiba-pr?"
                rows={2}
                className="min-h-[52px] flex-1 resize-none border-amber-200 focus-visible:ring-amber-400/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                disabled={enviando}
              />
              <button
                type="submit"
                disabled={enviando}
                aria-label="Enviar mensagem"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-[52px] shrink-0 gap-2 bg-amber-500 px-4 text-white hover:bg-amber-600 disabled:opacity-50"
                )}
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
