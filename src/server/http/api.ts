// Camada de Apresentação (lado servidor) — adaptador entre as rotas HTTP e os serviços de Aplicação.

import { NextResponse, type NextRequest } from "next/server";
import { servicos, type Servicos } from "@/server/app/container";
import { ErroAcessoNegado, ErroDeValidacao, ehErroDeDominio } from "@/server/domain/erros";
import type { Sessao } from "@/server/domain/modelos";
import { exigirSessao } from "./sessao";

const METODOS_DE_ESCRITA = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function respostaDeErro(erro: unknown): NextResponse {
  if (ehErroDeDominio(erro)) {
    return NextResponse.json({ erro: { codigo: erro.codigo, mensagem: erro.message, campo: erro.campo } }, { status: erro.status });
  }
  console.error("[vetcare] erro inesperado:", erro);
  return NextResponse.json({ erro: { codigo: "ERRO_INTERNO", mensagem: "Não foi possível concluir a operação. Tente novamente." } }, { status: 500 });
}

/** Recusa escritas vindas de outra origem (proteção contra CSRF, já que o token trafega em cookie). */
export function conferirOrigem(req: NextRequest): void {
  if (!METODOS_DE_ESCRITA.has(req.method)) return;
  const origem = req.headers.get("origin");
  if (!origem) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origem).host !== host) throw new ErroAcessoNegado("Origem da requisição não permitida.");
}

export async function corpoJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const corpo = await req.json();
    if (corpo && typeof corpo === "object" && !Array.isArray(corpo)) return corpo as Record<string, unknown>;
  } catch {
    // cai no erro abaixo
  }
  throw new ErroDeValidacao("Corpo da requisição inválido.");
}

interface Opcoes {
  status?: number;
  /** Rotas que continuam disponíveis enquanto o usuário ainda não trocou a senha provisória. */
  permitirSenhaProvisoria?: boolean;
}

interface Contexto {
  req: NextRequest;
  sessao: Sessao;
  s: Servicos;
}

/** Rota autenticada: valida origem e sessão, executa e converte erros de domínio em respostas HTTP. */
export async function rotaAutenticada(
  req: NextRequest,
  executar: (ctx: Contexto) => unknown | Promise<unknown>,
  { status = 200, permitirSenhaProvisoria = false }: Opcoes = {},
): Promise<NextResponse> {
  try {
    conferirOrigem(req);
    const sessao = await exigirSessao();
    if (sessao.trocarSenha && !permitirSenhaProvisoria) throw new ErroAcessoNegado("Defina sua senha antes de continuar.");
    const resultado = await executar({ req, sessao, s: servicos() });
    return NextResponse.json(resultado ?? { ok: true }, { status, headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
