import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 01 — Manter usuário (somente Administrador)
export function GET(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) => s.usuarios.painel(sessao, req.nextUrl.searchParams.get("busca") ?? undefined));
}

export function POST(req: NextRequest) {
  return rotaAutenticada(req, async ({ sessao, s }) => s.usuarios.cadastrar(sessao, await corpoJson(req)), { status: 201 });
}
