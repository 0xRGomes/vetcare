import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 05 — Manter animal
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/animais/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => ({ animal: s.animais.atualizar(sessao, id, await corpoJson(req)) }));
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/animais/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, ({ sessao, s }) => s.animais.excluir(sessao, id));
}
