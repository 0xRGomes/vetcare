// Camada de Aplicação (app.cadastros) — REQ 06: Manter veterinário.

import { horaValida } from "@/lib/datas";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/domain/erros";
import type { Profissional, Sessao } from "@/server/domain/modelos";
import type {
  AuditoriaRepository,
  ConsultaRepository,
  DadosProfissional,
  HashDeSenha,
  ProfissionalRepository,
  Relogio,
  TransacaoRepository,
  UsuarioRepository,
} from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";
import { texto } from "./validacao";

export class ProfissionalService {
  constructor(
    private readonly profissionais: ProfissionalRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly consultas: ConsultaRepository,
    private readonly senhas: HashDeSenha,
    private readonly auditoria: AuditoriaRepository,
    private readonly transacao: TransacaoRepository,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  listar(sessao: Sessao): Profissional[] {
    this.rbac.exigir(sessao, "veterinarios", "ler");
    return this.profissionais.listar();
  }

  async cadastrar(sessao: Sessao, entrada: Record<string, unknown>) {
    this.rbac.exigir(sessao, "veterinarios", "escrever");
    const dados = this.validar(entrada);
    const email = texto(entrada.email, 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ErroDeValidacao("Informe um e-mail de acesso válido.", "email");
    }
    if (this.usuarios.buscarPorEmail(email)) throw new ErroDeConflito("Já existe um usuário com este e-mail.");
    this.validarCrmv(dados.crmv);

    const senhaProvisoria = this.senhas.gerarProvisoria();
    const senhaHash = await this.senhas.gerar(senhaProvisoria);

    const id = this.transacao.executar(() => {
      const profissionalId = this.profissionais.criar(dados);
      this.usuarios.criar({ nome: dados.nome, email, perfil: "VETERINARIO", profissionalId }, senhaHash);
      this.registrar(sessao, `cadastrou o veterinário ${dados.nome}`);
      return profissionalId;
    });

    return { profissional: this.profissionalExistente(id), senhaProvisoria };
  }

  atualizar(sessao: Sessao, id: number, entrada: Record<string, unknown>): Profissional {
    this.rbac.exigir(sessao, "veterinarios", "escrever");
    this.profissionalExistente(id);
    const dados = this.validar(entrada);
    this.validarCrmv(dados.crmv, id);
    const { data, hora } = this.relogio.agora();

    this.transacao.executar(() => {
      if (this.consultas.temConsultasFuturasForaDoHorario(id, data, hora, dados.dias, dados.horaInicio, dados.horaFim)) {
        throw new ErroDeConflito("Cancele ou remaneje as consultas que ficam fora do novo horário antes de salvar.");
      }
      this.profissionais.atualizar(id, dados);
      const usuario = this.usuarios.buscarPorProfissional(id);
      if (usuario) this.usuarios.atualizar(usuario.id, { nome: dados.nome, email: usuario.email, perfil: "VETERINARIO", profissionalId: id });
      this.registrar(sessao, `alterou o cadastro do veterinário ${dados.nome}`);
    });
    return this.profissionalExistente(id);
  }

  desativar(sessao: Sessao, id: number): void {
    this.rbac.exigir(sessao, "veterinarios", "escrever");
    const profissional = this.profissionalExistente(id);
    const { data, hora } = this.relogio.agora();

    this.transacao.executar(() => {
      if (this.consultas.temConsultasFuturasDoProfissional(id, data, hora)) {
        throw new ErroDeConflito("Cancele ou remaneje as consultas futuras antes de remover este veterinário.");
      }
      this.profissionais.desativar(id);
      const usuario = this.usuarios.buscarPorProfissional(id);
      if (usuario) this.usuarios.definirAtivo(usuario.id, false);
      this.registrar(sessao, `removeu o veterinário ${profissional.nome} da agenda`);
    });
  }

  private validar(entrada: Record<string, unknown>): DadosProfissional {
    const nome = texto(entrada.nome, 120);
    const crmv = texto(entrada.crmv, 20).replace(/\s/g, "").toUpperCase();
    const especialidade = texto(entrada.especialidade, 120);
    const dias = Array.isArray(entrada.dias)
      ? [...new Set(entrada.dias.filter((dia): dia is number => Number.isInteger(dia) && dia >= 0 && dia <= 6))].sort((a, b) => a - b)
      : [];
    const horaInicio = entrada.horaInicio;
    const horaFim = entrada.horaFim;

    if (nome.length < 3) throw new ErroDeValidacao("Informe o nome completo do veterinário.", "nome");
    if (!crmv) throw new ErroDeValidacao("Informe o CRMV.", "crmv");
    if (!especialidade) throw new ErroDeValidacao("Informe a especialidade.", "especialidade");
    if (!dias.length) throw new ErroDeValidacao("Selecione ao menos um dia de atendimento.", "dias");
    if (!horaValida(horaInicio) || !horaValida(horaFim) || horaInicio >= horaFim) {
      throw new ErroDeValidacao("Informe um horário de atendimento válido.", "horaInicio");
    }

    return { nome, crmv, especialidade, dias, horaInicio, horaFim };
  }

  private validarCrmv(crmv: string, id?: number) {
    const existente = this.profissionais.buscarPorCrmv(crmv);
    if (existente && existente.id !== id) throw new ErroDeConflito("Já existe um veterinário cadastrado com este CRMV.");
  }

  private profissionalExistente(id: number): Profissional {
    const profissional = Number.isInteger(id) && id > 0 ? this.profissionais.buscarPorId(id) : null;
    if (!profissional) throw new ErroNaoEncontrado("Veterinário não encontrado.");
    return profissional;
  }

  private registrar(sessao: Sessao, acao: string) {
    this.auditoria.registrar(this.relogio.agora().instante.toISOString(), `${sessao.nome} ${acao}`);
  }
}
