import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 04 — Manter tutor
export function GET(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) => ({
    tutores: s.tutores.listar(sessao, req.nextUrl.searchParams.get("busca") ?? undefined),
  }));
}

export function POST(req: NextRequest) {
  return rotaAutenticada(req, async ({ sessao, s }) => ({ tutor: s.tutores.cadastrar(sessao, await corpoJson(req)) }), { status: 201 });
}
