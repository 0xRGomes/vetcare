// Camada de Aplicação (app.auth) — REQ 02: Autenticar usuário.

import { ErroBloqueado, ErroDeValidacao, ErroNaoAutenticado } from "@/server/domain/erros";
import type { Sessao } from "@/server/domain/modelos";
import type { AuditoriaRepository, HashDeSenha, Relogio, UsuarioRepository } from "@/server/domain/repositorios";
import type { TokenSessionService } from "./TokenSessionService";

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_EM_MINUTOS = 15;
export const TAMANHO_MINIMO_DA_SENHA = 8;

const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

export class AuthService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly senhas: HashDeSenha,
    private readonly sessoes: TokenSessionService,
    private readonly auditoria: AuditoriaRepository,
    private readonly relogio: Relogio,
  ) {}

  async autenticar(email: unknown, senha: unknown): Promise<{ token: string; sessao: Sessao }> {
    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
      throw new ErroDeValidacao("Informe e-mail e senha.");
    }
    const usuario = this.usuarios.buscarPorEmail(email.trim().toLowerCase());
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
    if (!usuario || !usuario.ativo) throw new ErroNaoAutenticado(CREDENCIAIS_INVALIDAS);

    const agora = this.relogio.agora().instante;
    if (usuario.bloqueadoAte && new Date(usuario.bloqueadoAte) > agora) {
      const minutos = Math.ceil((new Date(usuario.bloqueadoAte).getTime() - agora.getTime()) / 60000);
      throw new ErroBloqueado(`Acesso bloqueado temporariamente após ${MAX_TENTATIVAS} tentativas. Tente de novo em ${minutos} min.`);
    }

    if (!(await this.senhas.conferir(senha, usuario.senhaHash))) {
      // Um bloqueio já vencido zera a contagem.
      const anteriores = usuario.bloqueadoAte ? 0 : usuario.tentativasFalhas;
      const tentativas = anteriores + 1;
      if (tentativas >= MAX_TENTATIVAS) {
        const ate = new Date(agora.getTime() + BLOQUEIO_EM_MINUTOS * 60000).toISOString();
        this.usuarios.registrarFalhaDeLogin(usuario.id, 0, ate);
        this.auditoria.registrar(agora.toISOString(), `${MAX_TENTATIVAS} tentativas de login falhas · ${usuario.email} · acesso bloqueado por ${BLOQUEIO_EM_MINUTOS} min`);
        throw new ErroBloqueado(`Acesso bloqueado por ${BLOQUEIO_EM_MINUTOS} min após ${MAX_TENTATIVAS} tentativas incorretas.`);
      }
      this.usuarios.registrarFalhaDeLogin(usuario.id, tentativas, null);
      throw new ErroNaoAutenticado(CREDENCIAIS_INVALIDAS);
    }

    if (usuario.tentativasFalhas > 0 || usuario.bloqueadoAte) this.usuarios.limparFalhasDeLogin(usuario.id);
    this.usuarios.registrarAcesso(usuario.id, agora.toISOString());
    const sessao: Sessao = {
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      profissionalId: usuario.profissionalId,
      trocarSenha: usuario.senhaProvisoria,
    };
    return { token: await this.sessoes.abrir(sessao), sessao };
  }

  /** O próprio usuário troca a senha; obrigatório no primeiro acesso com senha provisória. */
  async alterarSenha(sessao: Sessao, senhaAtual: unknown, novaSenha: unknown): Promise<void> {
    if (typeof senhaAtual !== "string" || typeof novaSenha !== "string") throw new ErroDeValidacao("Informe a senha atual e a nova senha.");
    if (novaSenha.length < TAMANHO_MINIMO_DA_SENHA) {
      throw new ErroDeValidacao(`A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`, "novaSenha");
    }
    const usuario = this.usuarios.buscarPorId(sessao.usuarioId);
    if (!usuario || !(await this.senhas.conferir(senhaAtual, usuario.senhaHash))) {
      throw new ErroDeValidacao("A senha atual não confere.", "senhaAtual");
    }
    if (novaSenha === senhaAtual) throw new ErroDeValidacao("A nova senha precisa ser diferente da atual.", "novaSenha");
    this.usuarios.definirSenha(usuario.id, await this.senhas.gerar(novaSenha), false);
  }
}
