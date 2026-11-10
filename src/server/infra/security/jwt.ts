// Camada de Infraestrutura (infra.security) — emissão e verificação de tokens JWT (ADR-006 e ADR-010).

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SignJWT, jwtVerify } from "jose";
import { PERFIS, type Perfil, type Sessao } from "@/server/domain/modelos";
import type { EmissorDeToken } from "@/server/domain/repositorios";

const EMISSOR = "vetcare";
const VALIDADE_EM_SEGUNDOS = 8 * 60 * 60; // um expediente

/**
 * O segredo vem de JWT_SECRET. Se a variável não existir, um segredo aleatório é
 * criado uma única vez em data/jwt-secret (arquivo fora do Git, legível só pelo dono).
 */
function carregarSegredo(): Uint8Array {
  const doAmbiente = process.env.JWT_SECRET;
  if (doAmbiente) {
    if (doAmbiente.length < 32) throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
    return new TextEncoder().encode(doAmbiente);
  }
  const arquivo = resolve(/* turbopackIgnore: true */ process.cwd(), "data", "jwt-secret");
  if (!existsSync(arquivo)) {
    mkdirSync(dirname(arquivo), { recursive: true });
    writeFileSync(arquivo, randomBytes(48).toString("base64"), { mode: 0o600 });
  }
  return new TextEncoder().encode(readFileSync(arquivo, "utf8").trim());
}

let segredo: Uint8Array | null = null;
const chave = () => (segredo ??= carregarSegredo());

export const emissorJwt: EmissorDeToken = {
  validadeEmSegundos: VALIDADE_EM_SEGUNDOS,

  async emitir(sessao) {
    return new SignJWT({
      nome: sessao.nome,
      email: sessao.email,
      perfil: sessao.perfil,
      profissionalId: sessao.profissionalId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(String(sessao.usuarioId))
      .setIssuer(EMISSOR)
      .setIssuedAt()
      .setExpirationTime(`${VALIDADE_EM_SEGUNDOS}s`)
      .sign(chave());
  },

  async verificar(token) {
    try {
      const { payload } = await jwtVerify(token, chave(), { issuer: EMISSOR, algorithms: ["HS256"] });
      const perfil = payload.perfil as Perfil;
      const usuarioId = Number(payload.sub);
      if (!PERFIS.includes(perfil) || !Number.isInteger(usuarioId)) return null;
      return {
        usuarioId,
        nome: String(payload.nome ?? ""),
        email: String(payload.email ?? ""),
        perfil,
        profissionalId: typeof payload.profissionalId === "number" ? payload.profissionalId : null,
        trocarSenha: false, // definido pelo TokenSessionService a partir do banco
      } satisfies Sessao;
    } catch {
      return null;
    }
  },
};
