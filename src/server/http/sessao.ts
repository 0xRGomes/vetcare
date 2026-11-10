// Camada de Apresentação (lado servidor) — leitura da sessão a partir do cookie ou do cabeçalho Authorization.

import { cookies, headers } from "next/headers";
import { servicos } from "@/server/app/container";
import { ehErroDeDominio } from "@/server/domain/erros";
import type { Sessao } from "@/server/domain/modelos";

export const COOKIE_DO_TOKEN = "vetcare_token";

async function tokenDaRequisicao(): Promise<string | undefined> {
  const autorizacao = (await headers()).get("authorization");
  if (autorizacao?.startsWith("Bearer ")) return autorizacao.slice(7).trim();
  return (await cookies()).get(COOKIE_DO_TOKEN)?.value;
}

/** Sessão válida ou erro 401. Usada pelas rotas da API. */
export async function exigirSessao(): Promise<Sessao> {
  // Ler a requisição antes de abrir o banco: durante o `next build` não há requisição,
  // a leitura interrompe a pré-renderização e o banco não chega a ser tocado.
  const token = await tokenDaRequisicao();
  return servicos().sessoes.validar(token);
}

/** Sessão válida ou null. Usada pelas páginas para decidir redirecionamentos. */
export async function sessaoAtual(): Promise<Sessao | null> {
  try {
    return await exigirSessao();
  } catch (erro) {
    if (ehErroDeDominio(erro)) return null;
    throw erro;
  }
}
