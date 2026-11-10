import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 04 — Manter tutor
export async function GET(req: NextRequest, ctx: RouteContext<"/api/tutores/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, ({ sessao, s }) => ({ tutor: s.tutores.obter(sessao, id) }));
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/tutores/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => ({ tutor: s.tutores.atualizar(sessao, id, await corpoJson(req)) }));
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/tutores/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, ({ sessao, s }) => s.tutores.excluir(sessao, id));
}
