import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/profissionais/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => ({
    profissional: s.profissionais.atualizar(sessao, id, await corpoJson(req)),
  }));
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/profissionais/[id]">) {
  const id = Number((await ctx.params).id);
  return rotaAutenticada(req, ({ sessao, s }) => s.profissionais.desativar(sessao, id));
}
