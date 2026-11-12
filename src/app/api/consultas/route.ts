import type { NextRequest } from "next/server";
import { corpoJson, rotaAutenticada } from "@/server/http/api";

// REQ 07 — Agendar consulta
export function POST(req: NextRequest) {
  return rotaAutenticada(req, async ({ sessao, s }) => ({ consulta: s.agendamento.agendar(sessao, await corpoJson(req)) }), { status: 201 });
}

// REQ 08 — Cancelar consulta sem remover o histórico.
export function DELETE(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) =>
    s.agendamento.cancelar(sessao, Number(req.nextUrl.searchParams.get("id"))),
  );
}
