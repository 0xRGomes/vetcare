// Camada de Infraestrutura — conexão única com a base relacional (SQLite via node:sqlite).

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { COLUNAS_NOVAS, ESQUEMA } from "./esquema";

export function caminhoDoBanco(): string {
  return resolve(/* turbopackIgnore: true */ process.cwd(), process.env.VETCARE_DB || "data/vetcare.db");
}

export function abrirBanco(caminho = caminhoDoBanco()): DatabaseSync {
  if (caminho !== ":memory:") mkdirSync(dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  // Diário de reversão padrão (sem WAL): funciona também em pastas de rede e volumes compartilhados.
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(ESQUEMA);
  // Bancos criados por versões anteriores recebem as colunas que faltam.
  for (const [tabela, coluna, definicao] of COLUNAS_NOVAS) {
    const existentes = db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name);
    if (!existentes.includes(coluna)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
  return db;
}

/** Executa a função em uma transação; desfaz tudo se ela lançar erro. */
export function emTransacao<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}
