// Camada de Aplicação (app.auth) — REQ 01: Manter usuário.

import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/domain/erros";
import { PERFIS, ROTULO_PERFIL, type Perfil, type Sessao, type StatusUsuario, type Usuario } from "@/server/domain/modelos";
import type {
  AuditoriaRepository,
  DadosUsuario,
  HashDeSenha,
  ProfissionalRepository,
  Relogio,
  UsuarioRepository,
} from "@/server/domain/repositorios";
import { texto } from "@/server/app/cadastros/validacao";
import { MATRIZ_DE_PERMISSOES, ROTULO_DO_MODULO, type Modulo, type RBACManager } from "./RBACManager";

/** Usuário como é enviado à interface: sem o hash da senha. */
export interface UsuarioDTO {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  profissionalId: number | null;
  status: StatusUsuario;
  ultimoAcesso: string | null;
  senhaProvisoria: boolean;
}

export class UsuarioService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly profissionais: ProfissionalRepository,
    private readonly senhas: HashDeSenha,
    private readonly auditoria: AuditoriaRepository,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  /** Tudo o que a tela "Usuários e perfis" exibe. */
  painel(sessao: Sessao, busca?: string) {
    this.rbac.exigir(sessao, "usuarios", "ler");
    const vinculados = new Set(this.usuarios.listar().map((u) => u.profissionalId));
    return {
      usuarios: this.usuarios.listar(busca).map((u) => this.paraDTO(u)),
      /** Veterinários cadastrados, indicando os que ainda não têm usuário. */
      profissionais: this.profissionais.listar().map((p) => ({ id: p.id, nome: p.nome, livre: !vinculados.has(p.id) })),
      matriz: (Object.keys(MATRIZ_DE_PERMISSOES) as Modulo[]).map((m) => ({ modulo: ROTULO_DO_MODULO[m], niveis: MATRIZ_DE_PERMISSOES[m] })),
      auditoria: this.auditoria.recentes(6),
      agora: this.relogio.agora().instante.toISOString(),
    };
  }

  /** Cria o usuário com uma senha provisória, devolvida uma única vez para o administrador repassar. */
  async cadastrar(sessao: Sessao, entrada: Record<string, unknown>): Promise<{ usuario: UsuarioDTO; senhaProvisoria: string }> {
    this.rbac.exigir(sessao, "usuarios", "escrever");
    const dados = this.validar(entrada);
    const senhaProvisoria = this.senhas.gerarProvisoria();
    const id = this.usuarios.criar(dados, await this.senhas.gerar(senhaProvisoria));
    this.registrar(sessao, `cadastrou o usuário ${dados.nome} (${ROTULO_PERFIL[dados.perfil]})`);
    return { usuario: this.paraDTO(this.existente(id)), senhaProvisoria };
  }

  atualizar(sessao: Sessao, id: number, entrada: Record<string, unknown>): UsuarioDTO {
    this.rbac.exigir(sessao, "usuarios", "escrever");
    const atual = this.existente(id);
    const dados = this.validar(entrada, atual);
    if (dados.perfil !== atual.perfil) {
      if (atual.id === sessao.usuarioId) throw new ErroDeConflito("Você não pode alterar o próprio perfil.");
      this.protegerUltimoAdministrador(atual);
    }
    this.usuarios.atualizar(id, dados);
    this.registrar(
      sessao,
      dados.perfil !== atual.perfil ? `alterou o perfil de ${dados.nome} para ${ROTULO_PERFIL[dados.perfil]}` : `alterou os dados de ${dados.nome}`,
    );
    return this.paraDTO(this.existente(id));
  }

  /** "Excluir acesso": o usuário é desativado; o que ele registrou permanece no histórico. */
  desativar(sessao: Sessao, id: number): UsuarioDTO {
    this.rbac.exigir(sessao, "usuarios", "escrever");
    const usuario = this.existente(id);
    if (usuario.id === sessao.usuarioId) throw new ErroDeConflito("Você não pode excluir o próprio acesso.");
    this.protegerUltimoAdministrador(usuario);
    this.usuarios.definirAtivo(id, false);
    this.registrar(sessao, `excluiu o acesso de ${usuario.nome}`);
    return this.paraDTO(this.existente(id));
  }

  reativar(sessao: Sessao, id: number): UsuarioDTO {
    this.rbac.exigir(sessao, "usuarios", "escrever");
    const usuario = this.existente(id);
    this.usuarios.definirAtivo(id, true);
    this.registrar(sessao, `reativou o acesso de ${usuario.nome}`);
    return this.paraDTO(this.existente(id));
  }

  /** Gera nova senha provisória (também desfaz o bloqueio por tentativas). */
  async redefinirSenha(sessao: Sessao, id: number): Promise<{ usuario: UsuarioDTO; senhaProvisoria: string }> {
    this.rbac.exigir(sessao, "usuarios", "escrever");
    const usuario = this.existente(id);
    if (usuario.id === sessao.usuarioId) throw new ErroDeConflito("Para trocar a sua senha, use a opção Alterar senha.");
    const senhaProvisoria = this.senhas.gerarProvisoria();
    this.usuarios.definirSenha(id, await this.senhas.gerar(senhaProvisoria), true);
    this.registrar(sessao, `gerou nova senha provisória para ${usuario.nome}`);
    return { usuario: this.paraDTO(this.existente(id)), senhaProvisoria };
  }

  private registrar(sessao: Sessao, acao: string) {
    this.auditoria.registrar(this.relogio.agora().instante.toISOString(), `${sessao.nome} ${acao}`);
  }

  private protegerUltimoAdministrador(usuario: Usuario) {
    if (usuario.perfil === "ADMINISTRADOR" && usuario.ativo && this.usuarios.administradoresAtivos() <= 1) {
      throw new ErroDeConflito("O sistema precisa de pelo menos um administrador ativo.");
    }
  }

  private existente(id: number): Usuario {
    const usuario = Number.isInteger(id) ? this.usuarios.buscarPorId(id) : null;
    if (!usuario) throw new ErroNaoEncontrado("Usuário não encontrado.");
    return usuario;
  }

  private validar(e: Record<string, unknown>, atual?: Usuario): DadosUsuario {
    const nome = texto(e.nome, 120);
    const email = texto(e.email, 120).toLowerCase();
    if (nome.length < 3 || !email) throw new ErroDeValidacao("Preencha nome e e-mail para cadastrar.", "nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErroDeValidacao("Informe um e-mail válido.", "email");
    if (!PERFIS.includes(e.perfil as Perfil)) throw new ErroDeValidacao("Selecione o perfil de acesso.", "perfil");
    const perfil = e.perfil as Perfil;

    const comMesmoEmail = this.usuarios.buscarPorEmail(email);
    if (comMesmoEmail && comMesmoEmail.id !== atual?.id) throw new ErroDeConflito("Já existe um usuário com este e-mail.");

    // O perfil Veterinário enxerga a "própria agenda": precisa estar ligado a um veterinário cadastrado.
    let profissionalId: number | null = null;
    if (perfil === "VETERINARIO") {
      profissionalId = Number(e.profissionalId);
      if (!Number.isInteger(profissionalId) || !this.profissionais.buscarPorId(profissionalId)) {
        throw new ErroDeValidacao("Selecione o veterinário a que este usuário corresponde.", "profissionalId");
      }
      const dono = this.usuarios.buscarPorProfissional(profissionalId);
      if (dono && dono.id !== atual?.id) throw new ErroDeConflito(`Este veterinário já está vinculado ao usuário ${dono.nome}.`);
    }
    return { nome, email, perfil, profissionalId };
  }

  private paraDTO(u: Usuario): UsuarioDTO {
    const bloqueado = u.bloqueadoAte !== null && new Date(u.bloqueadoAte) > this.relogio.agora().instante;
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      profissionalId: u.profissionalId,
      status: !u.ativo ? "Inativo" : bloqueado ? "Bloqueado" : "Ativo",
      ultimoAcesso: u.ultimoAcesso,
      senhaProvisoria: u.senhaProvisoria,
    };
  }
}
