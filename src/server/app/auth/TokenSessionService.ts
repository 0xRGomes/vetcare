// Camada de Aplicação (app.auth) — sessão sem estado, baseada em token JWT.

import { ErroNaoAutenticado } from "@/server/domain/erros";
import type { Sessao } from "@/server/domain/modelos";
import type { EmissorDeToken, UsuarioRepository } from "@/server/domain/repositorios";

export class TokenSessionService {
  constructor(
    private readonly tokens: EmissorDeToken,
    private readonly usuarios: UsuarioRepository,
  ) {}

  get validadeEmSegundos() {
    return this.tokens.validadeEmSegundos;
  }

  abrir(sessao: Sessao): Promise<string> {
    return this.tokens.emitir(sessao);
  }

  /**
   * Valida o token e confirma que o usuário continua ativo — um usuário
   * desativado perde o acesso mesmo antes de o token expirar (ADR-006).
   */
  async validar(token: string | undefined | null): Promise<Sessao> {
    if (!token) throw new ErroNaoAutenticado();
    const sessao = await this.tokens.verificar(token);
    if (!sessao) throw new ErroNaoAutenticado("Sua sessão expirou. Faça login novamente.");
    const usuario = this.usuarios.buscarPorId(sessao.usuarioId);
    if (!usuario || !usuario.ativo) throw new ErroNaoAutenticado("Sua sessão expirou. Faça login novamente.");
    return { ...sessao, nome: usuario.nome, perfil: usuario.perfil, profissionalId: usuario.profissionalId };
  }
}
