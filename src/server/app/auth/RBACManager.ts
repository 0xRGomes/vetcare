// Camada de Aplicação (app.auth) — autorização baseada em papéis.
// Reproduz a matriz de permissões do Quadro 4 (ADR-006) para os módulos implementados na Etapa 2.

import { ErroAcessoNegado } from "@/server/domain/erros";
import type { Perfil, Sessao } from "@/server/domain/modelos";

export type Modulo = "usuarios" | "tutores-e-animais" | "veterinarios" | "agenda";
export type Nivel = "total" | "leitura" | "propria-agenda" | "sem-acesso";
export type Acao = "ler" | "escrever";

export const ROTULO_DO_MODULO: Record<Modulo, string> = {
  usuarios: "Usuários e perfis",
  "tutores-e-animais": "Tutores e animais",
  veterinarios: "Veterinários",
  agenda: "Agenda",
};

export const MATRIZ_DE_PERMISSOES: Record<Modulo, Record<Perfil, Nivel>> = {
  usuarios: { ADMINISTRADOR: "total", RECEPCIONISTA: "sem-acesso", VETERINARIO: "sem-acesso" },
  "tutores-e-animais": { ADMINISTRADOR: "total", RECEPCIONISTA: "total", VETERINARIO: "leitura" },
  veterinarios: { ADMINISTRADOR: "total", RECEPCIONISTA: "leitura", VETERINARIO: "leitura" },
  agenda: { ADMINISTRADOR: "total", RECEPCIONISTA: "total", VETERINARIO: "propria-agenda" },
};

export class RBACManager {
  nivel(perfil: Perfil, modulo: Modulo): Nivel {
    return MATRIZ_DE_PERMISSOES[modulo][perfil];
  }

  pode(perfil: Perfil, modulo: Modulo, acao: Acao): boolean {
    const nivel = this.nivel(perfil, modulo);
    if (nivel === "sem-acesso") return false;
    return acao === "ler" || nivel === "total";
  }

  /** Lança ErroAcessoNegado quando o perfil não pode executar a ação. */
  exigir(sessao: Sessao, modulo: Modulo, acao: Acao): void {
    if (!this.pode(sessao.perfil, modulo, acao)) throw new ErroAcessoNegado();
  }

  /**
   * Veterinários enxergam apenas a própria agenda: devolve o profissional
   * ao qual as consultas devem ser restritas, ou undefined se não há restrição.
   */
  restricaoDeAgenda(sessao: Sessao): number | undefined {
    if (this.nivel(sessao.perfil, "agenda") !== "propria-agenda") return undefined;
    if (!sessao.profissionalId) throw new ErroAcessoNegado("Usuário veterinário sem profissional vinculado.");
    return sessao.profissionalId;
  }

  /** Resumo das permissões, usado pela interface para exibir ou ocultar ações. */
  permissoes(sessao: Sessao) {
    return {
      inicio: this.nivel(sessao.perfil, "agenda") === "total",
      agendar: this.pode(sessao.perfil, "agenda", "escrever"),
      editarCadastros: this.pode(sessao.perfil, "tutores-e-animais", "escrever"),
      agendaPropria: this.nivel(sessao.perfil, "agenda") === "propria-agenda",
      usuarios: this.pode(sessao.perfil, "usuarios", "escrever"),
      gerenciarVeterinarios: this.pode(sessao.perfil, "veterinarios", "escrever"),
    };
  }
}

export type Permissoes = ReturnType<RBACManager["permissoes"]>;
