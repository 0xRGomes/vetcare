import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

export function GET(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) => ({ profissionais: s.profissionais.listar(sessao) }));
}

export function POST(req: NextRequest) {
  return rotaAutenticada(req, async ({ sessao, s }) => s.profissionais.cadastrar(sessao, await corpoJson(req)), { status: 201 });
}
