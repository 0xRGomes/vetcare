import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

// REQ 01 — gerar nova senha provisória
export async function POST(req: NextRequest, ctx: RouteContext<"/api/usuarios/[id]/senha">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, ({ sessao, s }) => s.usuarios.redefinirSenha(sessao, id));
}
