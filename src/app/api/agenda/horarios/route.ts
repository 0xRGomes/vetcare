import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

// REQ 07 — horários livres e ocupados de um profissional em uma data
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return rotaAutenticada(req, ({ sessao, s }) => s.agendamento.horariosDisponiveis(sessao, Number(q.get("profissional")), q.get("data")));
}
