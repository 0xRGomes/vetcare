import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 01 — Manter usuário
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/usuarios/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => ({ usuario: s.usuarios.atualizar(sessao, id, await corpoJson(req)) }));
}
