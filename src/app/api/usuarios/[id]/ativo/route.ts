import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 01 — excluir (desativar) ou reativar o acesso: { "ativo": false | true }
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/usuarios/[id]/ativo">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => {
    const { ativo } = await corpoJson(req);
    return { usuario: ativo === true ? s.usuarios.reativar(sessao, id) : s.usuarios.desativar(sessao, id) };
  });
}
