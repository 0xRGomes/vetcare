import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 05 — Manter animal (cadastro vinculado ao tutor)
export async function POST(req: NextRequest, ctx: RouteContext<"/api/tutores/[id]/animais">) {
  const tutorId = Number((await ctx.params).id);
  return rotaAutenticada(req, async ({ sessao, s }) => ({ animal: s.animais.cadastrar(sessao, tutorId, await corpoJson(req)) }), 201);
}
