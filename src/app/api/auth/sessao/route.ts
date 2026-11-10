import type { NextRequest } from "next/server";
import { rotaAutenticada } from "@/server/http/api";

export function GET(req: NextRequest) {
  return rotaAutenticada(req, ({ sessao, s }) => ({ sessao, permissoes: s.rbac.permissoes(sessao) }), { permitirSenhaProvisoria: true });
}
