import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

// REQ 09 — Consultar agenda: /api/agenda?de=AAAA-MM-DD&ate=AAAA-MM-DD[&profissional=ID]
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const profissional = q.get("profissional");
  return rotaAutenticada(req, ({ sessao, s }) =>
    s.agenda.consultar(sessao, q.get("de"), q.get("ate") ?? q.get("de"), profissional ? Number(profissional) : undefined),
  );
}
