import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 07 — Agendar consulta
export function POST(req: NextRequest) {
  return rotaAutenticada(req, async ({ sessao, s }) => ({ consulta: s.agendamento.agendar(sessao, await corpoJson(req)) }), 201);
}
