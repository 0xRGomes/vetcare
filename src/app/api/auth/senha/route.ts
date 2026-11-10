import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 01/02 — o próprio usuário define ou altera a senha
export function POST(req: NextRequest) {
  return rotaAutenticada(
    req,
    async ({ sessao, s }) => {
      const { senhaAtual, novaSenha } = await corpoJson(req);
      await s.auth.alterarSenha(sessao, senhaAtual, novaSenha);
    },
    { permitirSenhaProvisoria: true },
  );
}
