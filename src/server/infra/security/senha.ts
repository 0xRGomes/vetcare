// Camada de Infraestrutura (infra.security) — hash adaptativo de senhas com scrypt (ADR-006 e ADR-010).

import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import type { HashDeSenha } from "@/server/domain/repositorios";

const CUSTO = 16384; // N
const BLOCO = 8; // r
const PARALELISMO = 1; // p
const TAMANHO = 64;

function derivar(senha: string, sal: Buffer, n: number, r: number, p: number, tamanho: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha.normalize("NFKC"), sal, tamanho, { N: n, r, p }, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

export const hashScrypt: HashDeSenha = {
  async gerar(senha) {
    const sal = randomBytes(16);
    const chave = await derivar(senha, sal, CUSTO, BLOCO, PARALELISMO, TAMANHO);
    return ["scrypt", CUSTO, BLOCO, PARALELISMO, sal.toString("base64"), chave.toString("base64")].join("$");
  },

  async conferir(senha, hash) {
    const [algoritmo, n, r, p, sal, esperado] = hash.split("$");
    if (algoritmo !== "scrypt" || !esperado) return false;
    const chaveEsperada = Buffer.from(esperado, "base64");
    const chave = await derivar(senha, Buffer.from(sal, "base64"), Number(n), Number(r), Number(p), chaveEsperada.length);
    return timingSafeEqual(chave, chaveEsperada);
  },
};

/** Versão síncrona, usada apenas na carga inicial de dados de demonstração. */
export function gerarHashSync(senha: string): string {
  const sal = randomBytes(16);
  const chave = scryptSync(senha.normalize("NFKC"), sal, TAMANHO, { N: CUSTO, r: BLOCO, p: PARALELISMO });
  return ["scrypt", CUSTO, BLOCO, PARALELISMO, sal.toString("base64"), chave.toString("base64")].join("$");
}
