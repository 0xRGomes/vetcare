import { NextResponse, type NextRequest } from "next/server";
import { conferirOrigem, respostaDeErro } from "@/server/http/api";
import { COOKIE_DO_TOKEN } from "@/server/http/sessao";

export async function POST(req: NextRequest) {
  try {
    conferirOrigem(req);
    const resposta = NextResponse.json({ ok: true });
    resposta.cookies.delete(COOKIE_DO_TOKEN);
    return resposta;
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
