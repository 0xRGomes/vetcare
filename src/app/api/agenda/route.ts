import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

// REQ 09 — Consultar agenda por período ou todas as consultas futuras de um profissional.
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const profissional = q.get("profissional");
  if (q.get("todas") === "1") {
    return rotaAutenticada(req, ({ sessao, s }) =>
      s.agenda.consultarTodasFuturasDoProfissional(sessao, profissional ? Number(profissional) : undefined),
    );
  }
  return rotaAutenticada(req, ({ sessao, s }) =>
    s.agenda.consultar(sessao, q.get("de"), q.get("ate") ?? q.get("de"), profissional ? Number(profissional) : undefined),
  );
}
