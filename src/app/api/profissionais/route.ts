import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

export function GET(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) => ({ profissionais: s.profissionais.listar(sessao) }));
}
