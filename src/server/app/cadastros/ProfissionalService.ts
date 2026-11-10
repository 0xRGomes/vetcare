// Camada de Aplicação (app.cadastros) — consulta de profissionais.
// A manutenção (REQ 06) está fora do escopo da Etapa 2; aqui há apenas leitura.

import type { Profissional, Sessao } from "@/server/domain/modelos";
import type { ProfissionalRepository } from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";

export class ProfissionalService {
  constructor(
    private readonly profissionais: ProfissionalRepository,
    private readonly rbac: RBACManager,
  ) {}

  listar(sessao: Sessao): Profissional[] {
    this.rbac.exigir(sessao, "veterinarios", "ler");
    return this.profissionais.listar();
  }
}
