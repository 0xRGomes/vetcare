// Cliente HTTP da interface. O token JWT segue no cookie httpOnly, enviado pelo navegador.

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly campo?: string,
  ) {
    super(mensagem);
  }
}

export async function api<T>(caminho: string, opcoes: { metodo?: "GET" | "POST" | "PUT" | "DELETE"; corpo?: unknown } = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      method: opcoes.metodo ?? "GET",
      headers: opcoes.corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      cache: "no-store",
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique a rede e tente novamente.", 0);
  }
  const dados = await resposta.json().catch(() => null);
  if (resposta.ok) return dados as T;
  // Sessão expirada em qualquer tela interna: volta para o login.
  if (resposta.status === 401 && !caminho.startsWith("/api/auth/login")) {
    recarregarEm("/login?expirada=1");
  }
  throw new ErroApi(dados?.erro?.mensagem ?? "Não foi possível concluir a operação.", resposta.status, dados?.erro?.campo);
}

export const mensagemDe = (erro: unknown) => (erro instanceof Error ? erro.message : "Não foi possível concluir a operação.");

/** Navegação com recarga completa: usada ao entrar e sair, para descartar o estado da sessão anterior. */
export function recarregarEm(destino: string): void {
  window.location.assign(destino);
}
