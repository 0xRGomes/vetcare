// Camada de Aplicação (app.auth) — REQ 02: Autenticar usuário.

import { ErroBloqueado, ErroDeValidacao, ErroNaoAutenticado } from "@/server/domain/erros";
import type { Sessao } from "@/server/domain/modelos";
import type { HashDeSenha, Relogio, UsuarioRepository } from "@/server/domain/repositorios";
import type { TokenSessionService } from "./TokenSessionService";

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_EM_MINUTOS = 15;

const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

export class AuthService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly senhas: HashDeSenha,
    private readonly sessoes: TokenSessionService,
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
        throw new ErroBloqueado(`Acesso bloqueado por ${BLOQUEIO_EM_MINUTOS} min após ${MAX_TENTATIVAS} tentativas incorretas.`);
      }
      this.usuarios.registrarFalhaDeLogin(usuario.id, tentativas, null);
      throw new ErroNaoAutenticado(CREDENCIAIS_INVALIDAS);
    }

    if (usuario.tentativasFalhas > 0 || usuario.bloqueadoAte) this.usuarios.limparFalhasDeLogin(usuario.id);
    const sessao: Sessao = {
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      profissionalId: usuario.profissionalId,
    };
    return { token: await this.sessoes.abrir(sessao), sessao };
  }
}
