// Camada de Domínio — erros de negócio. A camada de Apresentação os traduz em respostas HTTP.

export class ErroDeDominio extends Error {
  /** Marca usada no lugar de instanceof, que falha quando o módulo é recarregado em desenvolvimento. */
  readonly erroDeDominio = true;

  constructor(
    mensagem: string,
    readonly status: number,
    readonly codigo: string,
  ) {
    super(mensagem);
  }
}

export class ErroDeValidacao extends ErroDeDominio {
  constructor(mensagem: string, readonly campo?: string) {
    super(mensagem, 400, "VALIDACAO");
  }
}

export class ErroNaoAutenticado extends ErroDeDominio {
  constructor(mensagem = "Faça login para continuar.") {
    super(mensagem, 401, "NAO_AUTENTICADO");
  }
}

export class ErroAcessoNegado extends ErroDeDominio {
  constructor(mensagem = "Seu perfil não tem permissão para esta operação.") {
    super(mensagem, 403, "ACESSO_NEGADO");
  }
}

export class ErroNaoEncontrado extends ErroDeDominio {
  constructor(mensagem: string) {
    super(mensagem, 404, "NAO_ENCONTRADO");
  }
}

export class ErroDeConflito extends ErroDeDominio {
  constructor(mensagem: string) {
    super(mensagem, 409, "CONFLITO");
  }
}

export class ErroBloqueado extends ErroDeDominio {
  constructor(mensagem: string) {
    super(mensagem, 423, "BLOQUEADO");
  }
}

export function ehErroDeDominio(erro: unknown): erro is ErroDeDominio & { campo?: string } {
  return typeof erro === "object" && erro !== null && (erro as { erroDeDominio?: unknown }).erroDeDominio === true;
}
