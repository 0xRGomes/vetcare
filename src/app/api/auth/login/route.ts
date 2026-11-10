import { NextResponse, type NextRequest } from "next/server";
import { servicos } from "@/server/app/container";
import { conferirOrigem, corpoJson, respostaDeErro } from "@/server/http/api";
import { COOKIE_DO_TOKEN } from "@/server/http/sessao";

// REQ 02 — Autenticar usuário
export async function POST(req: NextRequest) {
  try {
    conferirOrigem(req);
    const { email, senha } = await corpoJson(req);
    const s = servicos();
    const { token, sessao } = await s.auth.autenticar(email, senha);
    const resposta = NextResponse.json({ sessao, permissoes: s.rbac.permissoes(sessao), token });
    const https = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol).startsWith("https");
    resposta.cookies.set(COOKIE_DO_TOKEN, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: https,
      path: "/",
      maxAge: s.sessoes.validadeEmSegundos,
    });
    return resposta;
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
