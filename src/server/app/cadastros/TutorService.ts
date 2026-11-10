// Camada de Aplicação (app.cadastros) — REQ 04: Manter tutor.

import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/domain/erros";
import type { Sessao, TutorComAnimais } from "@/server/domain/modelos";
import type { ConsultaRepository, Relogio, TutorRepository } from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";
import { texto } from "./validacao";

/** Tutor como é enviado à interface: o CPF sai sempre mascarado. */
export type TutorDTO = Omit<TutorComAnimais, "cpf"> & { cpf: string };

export function mascararCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.***-${cpf.slice(9)}`;
}

const paraDTO = (t: TutorComAnimais): TutorDTO => ({ ...t, cpf: mascararCpf(t.cpf) });

export class TutorService {
  constructor(
    private readonly tutores: TutorRepository,
    private readonly consultas: ConsultaRepository,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  listar(sessao: Sessao, busca?: string): TutorDTO[] {
    this.rbac.exigir(sessao, "tutores-e-animais", "ler");
    return this.tutores.listar(busca).map(paraDTO);
  }

  obter(sessao: Sessao, id: number): TutorDTO {
    this.rbac.exigir(sessao, "tutores-e-animais", "ler");
    return paraDTO(this.existente(id));
  }

  cadastrar(sessao: Sessao, entrada: Record<string, unknown>): TutorDTO {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    const dados = this.validar(entrada);
    const cpf = String(entrada.cpf ?? "").replace(/\D/g, "");
    if (cpf.length !== 11) throw new ErroDeValidacao("O CPF precisa ter 11 dígitos.", "cpf");
    if (this.tutores.buscarPorCpf(cpf)) throw new ErroDeConflito("Já existe um tutor cadastrado com este CPF.");
    const id = this.tutores.criar({ ...dados, cpf }, this.relogio.agora().data);
    return paraDTO(this.existente(id));
  }

  /** O CPF identifica o tutor e não é alterado depois do cadastro. */
  atualizar(sessao: Sessao, id: number, entrada: Record<string, unknown>): TutorDTO {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    this.existente(id);
    this.tutores.atualizar(id, this.validar(entrada));
    return paraDTO(this.existente(id));
  }

  /**
   * Exclusão lógica: o tutor e seus animais deixam de aparecer nos cadastros,
   * as consultas futuras são canceladas e o histórico permanece no banco.
   */
  excluir(sessao: Sessao, id: number): { consultasCanceladas: number } {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    this.existente(id);
    const { data, hora } = this.relogio.agora();
    const consultasCanceladas = this.consultas.cancelarFuturasDoTutor(id, data, hora);
    this.tutores.excluir(id);
    return { consultasCanceladas };
  }

  private existente(id: number): TutorComAnimais {
    const tutor = Number.isInteger(id) ? this.tutores.buscarPorId(id) : null;
    if (!tutor) throw new ErroNaoEncontrado("Tutor não encontrado.");
    return tutor;
  }

  private validar(e: Record<string, unknown>) {
    const nome = texto(e.nome, 120);
    const telefone = texto(e.telefone, 30);
    const email = texto(e.email, 120);
    if (nome.length < 3) throw new ErroDeValidacao("Informe o nome completo do tutor.", "nome");
    if (telefone.replace(/\D/g, "").length < 10) throw new ErroDeValidacao("Informe um telefone com DDD.", "telefone");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErroDeValidacao("Informe um e-mail válido.", "email");
    return {
      nome,
      telefone,
      email,
      endereco: texto(e.endereco, 200),
      canalWhatsapp: e.canalWhatsapp !== false,
      canalEmail: e.canalEmail !== false,
    };
  }
}
