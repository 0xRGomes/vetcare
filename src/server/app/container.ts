// Raiz de composição: liga os serviços de Aplicação às implementações de Infraestrutura.
// É o único ponto em que a Aplicação conhece classes concretas da Infraestrutura.

import type { DatabaseSync } from "node:sqlite";
import { abrirBanco } from "@/server/infra/db/conexao";
import { bancoVazio, carregarDadosIniciais } from "@/server/infra/db/dados-iniciais";
import {
  SqliteAnimalRepository,
  SqliteAuditoriaRepository,
  SqliteConsultaRepository,
  SqliteProfissionalRepository,
  SqliteTutorRepository,
  SqliteTransacaoRepository,
  SqliteUsuarioRepository,
} from "@/server/infra/db/repositorios";
import type { Relogio } from "@/server/domain/repositorios";
import { relogioDoSistema } from "@/server/infra/relogio";
import { emissorJwt } from "@/server/infra/security/jwt";
import { hashScrypt } from "@/server/infra/security/senha";
import { AgendaQueryEngine } from "./agendamento/AgendaQueryEngine";
import { AgendamentoService } from "./agendamento/AgendamentoService";
import { SlotConflictManager } from "./agendamento/SlotConflictManager";
import { AuthService } from "./auth/AuthService";
import { RBACManager } from "./auth/RBACManager";
import { TokenSessionService } from "./auth/TokenSessionService";
import { UsuarioService } from "./auth/UsuarioService";
import { AnimalService } from "./cadastros/AnimalService";
import { ProfissionalService } from "./cadastros/ProfissionalService";
import { TutorService } from "./cadastros/TutorService";

// A conexão com o banco é única por processo e sobrevive às recargas do modo de desenvolvimento;
// os serviços são leves e remontados a cada recarga, para que alterações no código valham na hora.
const global = globalThis as typeof globalThis & { __vetcareDb?: DatabaseSync };

function banco(): DatabaseSync {
  if (!global.__vetcareDb) {
    const db = abrirBanco();
    if (process.env.VETCARE_SEED !== "0" && bancoVazio(db)) {
      const { data, hora } = relogioDoSistema.agora();
      carregarDadosIniciais(db, data, hora);
    }
    global.__vetcareDb = db;
  }
  return global.__vetcareDb;
}

/** Monta os serviços sobre um banco e um relógio. Os testes usam um banco em memória e um relógio fixo. */
export function montarServicos(db: DatabaseSync, relogio: Relogio = relogioDoSistema) {

  const usuarios = new SqliteUsuarioRepository(db);
  const profissionais = new SqliteProfissionalRepository(db);
  const transacao = new SqliteTransacaoRepository(db);
  const tutores = new SqliteTutorRepository(db);
  const animais = new SqliteAnimalRepository(db);
  const consultas = new SqliteConsultaRepository(db);
  const auditoria = new SqliteAuditoriaRepository(db);

  const rbac = new RBACManager();
  const sessoes = new TokenSessionService(emissorJwt, usuarios);
  const conflitos = new SlotConflictManager(consultas, relogio);

  return {
    rbac,
    sessoes,
    auth: new AuthService(usuarios, hashScrypt, sessoes, auditoria, relogio),
    usuarios: new UsuarioService(usuarios, profissionais, hashScrypt, auditoria, rbac, relogio),
    tutores: new TutorService(tutores, consultas, rbac, relogio),
    animais: new AnimalService(animais, tutores, consultas, rbac, relogio),
    profissionais: new ProfissionalService(profissionais, usuarios, consultas, hashScrypt, auditoria, transacao, rbac, relogio),
    agendamento: new AgendamentoService(consultas, animais, profissionais, conflitos, rbac, relogio),
    agenda: new AgendaQueryEngine(consultas, profissionais, tutores, animais, rbac, relogio),
  };
}

export type Servicos = ReturnType<typeof montarServicos>;

let instancia: Servicos | undefined;

export function servicos(): Servicos {
  return (instancia ??= montarServicos(banco()));
}
