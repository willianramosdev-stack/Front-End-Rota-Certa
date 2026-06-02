"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Pencil, Receipt, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { atualizarViagem, excluirViagem, listarViagens } from "@/lib/api";
import { data, dataParaApi, moeda } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ListarViagem } from "@/types";

const ITENS_POR_PAGINA = 10;

function viagemAberta(viagem: ListarViagem) {
  return !viagem.dataChegada;
}

function ordenarViagens(viagens: ListarViagem[]) {
  return [...viagens].sort((a, b) => {
    const abertaA = viagemAberta(a);
    const abertaB = viagemAberta(b);

    if (abertaA !== abertaB) {
      return abertaA ? -1 : 1;
    }

    return new Date(b.dataSaida).getTime() - new Date(a.dataSaida).getTime();
  });
}

function paginasVisiveis(atual: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, indice) => indice + 1);
  }

  const paginas = new Set<number>([1, total, atual]);
  if (atual > 1) paginas.add(atual - 1);
  if (atual < total) paginas.add(atual + 1);

  const ordenadas = [...paginas].sort((a, b) => a - b);
  const resultado: (number | "ellipsis")[] = [];

  for (let indice = 0; indice < ordenadas.length; indice++) {
    if (indice > 0 && ordenadas[indice] - ordenadas[indice - 1] > 1) {
      resultado.push("ellipsis");
    }
    resultado.push(ordenadas[indice]);
  }

  return resultado;
}

function lucroClasse(lucro: number) {
  return lucro >= 0 ? "text-emerald-700" : "text-red-600";
}

function ViagemAcoes({
  viagem,
  onExcluir,
  onAbrirEncerrar,
  compacto = false,
}: {
  viagem: ListarViagem;
  onExcluir: (id: number) => void;
  onAbrirEncerrar: (viagem: ListarViagem) => void;
  compacto?: boolean;
}) {
  const encerrada = !!viagem.dataChegada;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        compacto ? "justify-end" : "border-t border-amber-100/80 pt-3"
      )}
    >
      {!encerrada && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAbrirEncerrar(viagem)}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        render={<Link href={`/viagens/${viagem.id}`} />}
      >
        <Receipt className="h-3.5 w-3.5" />
        Gastos
      </Button>
      <Button
        size="sm"
        variant="outline"
        render={<Link href={`/viagens/${viagem.id}/editar`} />}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onExcluir(viagem.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Excluir
      </Button>
    </div>
  );
}

function ModalEncerrarViagem({
  viagem,
  encerrando,
  onConfirmar,
  onFechar,
}: {
  viagem: ListarViagem | null;
  encerrando: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  return (
    <AlertDialog
      open={!!viagem}
      onOpenChange={(aberto) => {
        if (!aberto && !encerrando) onFechar();
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-50 text-emerald-700">
            <CheckCircle2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Encerrar viagem?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                A viagem será marcada como concluída. Depois disso, o botão
                Encerrar some da lista.
              </p>
              {viagem && (
                <div className="rounded-lg border border-amber-100/80 bg-amber-50/80 px-3 py-2.5 text-sm text-foreground">
                  <p className="font-medium text-foreground">
                    {viagem.origem} → {viagem.destino}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Saída: {data(viagem.dataSaida)}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Chegada: <span className="font-medium text-emerald-700">{dataHoje}</span>
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={encerrando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={encerrando} onClick={onConfirmar}>
            {encerrando ? "Encerrando..." : "Sim, encerrar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ViagemCard({
  viagem,
  onExcluir,
  onAbrirEncerrar,
}: {
  viagem: ListarViagem;
  onExcluir: (id: number) => void;
  onAbrirEncerrar: (viagem: ListarViagem) => void;
}) {
  return (
    <Card className="border-amber-200/60 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <Link
          href={`/viagens/${viagem.id}`}
          className="flex items-start justify-between gap-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {viagem.origem}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              → {viagem.destino}
            </p>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
        </Link>

        <p className="mt-2 text-xs text-muted-foreground">
          Saída: {data(viagem.dataSaida)}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-muted-foreground">Frete</p>
            <p className="mt-0.5 font-semibold">{moeda(viagem.valorFrete)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-muted-foreground">Custos</p>
            <p className="mt-0.5 font-semibold">{moeda(viagem.totalCustos)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-muted-foreground">Lucro</p>
            <p className={cn("mt-0.5 font-semibold", lucroClasse(viagem.lucroLiquido))}>
              {moeda(viagem.lucroLiquido)}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ViagemAcoes
            viagem={viagem}
            onExcluir={onExcluir}
            onAbrirEncerrar={onAbrirEncerrar}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PaginacaoViagens({
  pagina,
  totalPaginas,
  totalItens,
  onPaginaChange,
  className,
}: {
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  onPaginaChange: (pagina: number) => void;
  className?: string;
}) {
  const inicio = (pagina - 1) * ITENS_POR_PAGINA + 1;
  const fim = Math.min(pagina * ITENS_POR_PAGINA, totalItens);
  const paginas = paginasVisiveis(pagina, totalPaginas);
  const temVariasPaginas = totalPaginas > 1;

  function irPara(novaPagina: number, evento: MouseEvent<HTMLAnchorElement>) {
    evento.preventDefault();
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      onPaginaChange(novaPagina);
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 pt-4 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {inicio}–{fim} de {totalItens} viagens
        </p>

        {temVariasPaginas && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Anterior"
                  aria-disabled={pagina === 1}
                  className={cn(pagina === 1 && "pointer-events-none opacity-50")}
                  onClick={(evento) => irPara(pagina - 1, evento)}
                />
              </PaginationItem>

              {paginas.map((item, indice) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${indice}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={pagina === item}
                      onClick={(evento) => irPara(item, evento)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Próxima"
                  aria-disabled={pagina === totalPaginas}
                  className={cn(
                    pagina === totalPaginas && "pointer-events-none opacity-50"
                  )}
                  onClick={(evento) => irPara(pagina + 1, evento)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

export default function ViagensPage() {
  const [lista, setLista] = useState<ListarViagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [viagemParaEncerrar, setViagemParaEncerrar] = useState<ListarViagem | null>(null);
  const [encerrando, setEncerrando] = useState(false);

  const listaOrdenada = useMemo(() => ordenarViagens(lista), [lista]);

  const totalPaginas = Math.max(1, Math.ceil(listaOrdenada.length / ITENS_POR_PAGINA));

  const listaPagina = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    return listaOrdenada.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [listaOrdenada, pagina]);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  function carregar() {
    setCarregando(true);
    setErro("");
    listarViagens()
      .then(setLista)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function deletar(id: number) {
    if (!confirm("Excluir esta viagem?")) return;
    try {
      await excluirViagem(id);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  async function confirmarEncerrar() {
    if (!viagemParaEncerrar) return;
    setEncerrando(true);
    setErro("");
    try {
      await atualizarViagem({
        ...viagemParaEncerrar,
        dataChegada: dataParaApi(new Date().toISOString().slice(0, 10)),
      });
      setViagemParaEncerrar(null);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao encerrar viagem");
    } finally {
      setEncerrando(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PageHeader
        className="mb-4 shrink-0"
        title="Viagens"
        description="Suas rotas e o resumo financeiro de cada uma."
        actionLabel="Nova viagem"
        actionHref="/viagens/nova"
      />

      <ModalEncerrarViagem
        viagem={viagemParaEncerrar}
        encerrando={encerrando}
        onConfirmar={confirmarEncerrar}
        onFechar={() => setViagemParaEncerrar(null)}
      />

      {erro && (
        <p className="mb-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}
      {carregando && (
        <p className="shrink-0 text-sm text-muted-foreground">Carregando viagens...</p>
      )}

      {!carregando && lista.length === 0 && (
        <Card className="border-amber-100/80">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhuma viagem cadastrada.
          </CardContent>
        </Card>
      )}

      {!carregando && !!listaOrdenada.length && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto md:hidden">
            <div className="space-y-3 pb-2">
              {listaPagina.map((v) => (
                <ViagemCard
                  key={v.id}
                  viagem={v}
                  onExcluir={deletar}
                  onAbrirEncerrar={setViagemParaEncerrar}
                />
              ))}
            </div>
          </div>

          <Card className="hidden min-h-0 flex-1 overflow-hidden border-amber-100/80 shadow-sm md:flex md:flex-col">
            <CardContent className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rota</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Frete</TableHead>
                    <TableHead>Custos</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaPagina.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Link
                          href={`/viagens/${v.id}`}
                          className="font-medium hover:underline"
                        >
                          {v.origem} → {v.destino}
                        </Link>
                      </TableCell>
                      <TableCell>{data(v.dataSaida)}</TableCell>
                      <TableCell>{moeda(v.valorFrete)}</TableCell>
                      <TableCell>{moeda(v.totalCustos)}</TableCell>
                      <TableCell className={lucroClasse(v.lucroLiquido)}>
                        {moeda(v.lucroLiquido)}
                      </TableCell>
                      <TableCell>
                        <ViagemAcoes
                          viagem={v}
                          onExcluir={deletar}
                          onAbrirEncerrar={setViagemParaEncerrar}
                          compacto
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <PaginacaoViagens
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalItens={listaOrdenada.length}
            onPaginaChange={setPagina}
          />
        </div>
      )}
    </div>
  );
}
