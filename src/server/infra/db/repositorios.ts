// Camada de Infraestrutura — implementações SQLite dos repositórios definidos no Domínio.

import type { DatabaseSync } from "node:sqlite";
import { ErroDeConflito } from "@/server/domain/erros";
import type {
  Animal,
  ConsultaDetalhada,
  Especie,
  MotivoConsulta,
  Perfil,
  Profissional,
  Sexo,
  StatusConsulta,
  Tutor,
  TutorComAnimais,
  Usuario,
} from "@/server/domain/modelos";
import type {
  AnimalRepository,
  AuditoriaRepository,
  ConsultaRepository,
  DadosUsuario,
  ProfissionalRepository,
  TutorRepository,
  UsuarioRepository,
} from "@/server/domain/repositorios";
import { emTransacao } from "./conexao";

type Linha = Record<string, unknown>;

const paraUsuario = (l: Linha): Usuario => ({
  id: l.id as number,
  nome: l.nome as string,
  email: l.email as string,
  senhaHash: l.senha_hash as string,
  perfil: l.perfil as Perfil,
  ativo: l.ativo === 1,
  tentativasFalhas: l.tentativas_falhas as number,
  bloqueadoAte: (l.bloqueado_ate as string | null) ?? null,
  profissionalId: (l.profissional_id as number | null) ?? null,
  senhaProvisoria: l.senha_provisoria === 1,
  ultimoAcesso: (l.ultimo_acesso as string | null) ?? null,
});

const paraProfissional = (l: Linha): Profissional => ({
  id: l.id as number,
  nome: l.nome as string,
  crmv: l.crmv as string,
  especialidade: l.especialidade as string,
  dias: String(l.dias).split(",").filter(Boolean).map(Number),
  horaInicio: l.hora_inicio as string,
  horaFim: l.hora_fim as string,
});

const paraTutor = (l: Linha): Tutor => ({
  id: l.id as number,
  nome: l.nome as string,
  cpf: l.cpf as string,
  telefone: l.telefone as string,
  email: l.email as string,
  endereco: l.endereco as string,
  canalWhatsapp: l.canal_whatsapp === 1,
  canalEmail: l.canal_email === 1,
  criadoEm: l.criado_em as string,
});

const paraAnimal = (l: Linha): Animal => ({
  id: l.id as number,
  tutorId: l.tutor_id as number,
  nome: l.nome as string,
  especie: l.especie as Especie,
  raca: l.raca as string,
  sexo: l.sexo as Sexo,
  nascimento: l.nascimento as string,
});

const paraConsulta = (l: Linha): ConsultaDetalhada => ({
  id: l.id as number,
  animalId: l.animal_id as number,
  profissionalId: l.profissional_id as number,
  data: l.data as string,
  hora: l.hora as string,
  motivo: l.motivo as MotivoConsulta,
  status: l.status as StatusConsulta,
  animal: { id: l.animal_id as number, nome: l.animal_nome as string, especie: l.animal_especie as Especie, raca: l.animal_raca as string },
  tutor: { id: l.tutor_id as number, nome: l.tutor_nome as string },
  profissional: { id: l.profissional_id as number, nome: l.profissional_nome as string },
});

export class SqliteUsuarioRepository implements UsuarioRepository {
  constructor(private readonly db: DatabaseSync) {}

  buscarPorEmail(email: string) {
    const l = this.db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email);
    return l ? paraUsuario(l) : null;
  }

  buscarPorId(id: number) {
    const l = this.db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
    return l ? paraUsuario(l) : null;
  }

  registrarFalhaDeLogin(id: number, tentativas: number, bloqueadoAte: string | null) {
    this.db.prepare("UPDATE usuarios SET tentativas_falhas = ?, bloqueado_ate = ? WHERE id = ?").run(tentativas, bloqueadoAte, id);
  }

  limparFalhasDeLogin(id: number) {
    this.db.prepare("UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?").run(id);
  }

  registrarAcesso(id: number, instante: string) {
    this.db.prepare("UPDATE usuarios SET ultimo_acesso = ? WHERE id = ?").run(instante, id);
  }

  listar(busca?: string) {
    const termo = `%${(busca ?? "").trim().replace(/[%_]/g, "")}%`;
    return this.db
      .prepare("SELECT * FROM usuarios WHERE nome LIKE ? OR email LIKE ? ORDER BY ativo DESC, nome COLLATE NOCASE")
      .all(termo, termo)
      .map(paraUsuario);
  }

  buscarPorProfissional(profissionalId: number) {
    const l = this.db.prepare("SELECT * FROM usuarios WHERE profissional_id = ?").get(profissionalId);
    return l ? paraUsuario(l) : null;
  }

  criar(d: DadosUsuario, senhaHash: string) {
    const r = this.db
      .prepare("INSERT INTO usuarios (nome, email, senha_hash, perfil, profissional_id, senha_provisoria) VALUES (?, ?, ?, ?, ?, 1)")
      .run(d.nome, d.email, senhaHash, d.perfil, d.profissionalId);
    return Number(r.lastInsertRowid);
  }

  atualizar(id: number, d: DadosUsuario) {
    this.db.prepare("UPDATE usuarios SET nome = ?, email = ?, perfil = ?, profissional_id = ? WHERE id = ?").run(d.nome, d.email, d.perfil, d.profissionalId, id);
  }

  definirAtivo(id: number, ativo: boolean) {
    this.db.prepare("UPDATE usuarios SET ativo = ?, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?").run(ativo ? 1 : 0, id);
  }

  definirSenha(id: number, senhaHash: string, provisoria: boolean) {
    this.db
      .prepare("UPDATE usuarios SET senha_hash = ?, senha_provisoria = ?, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?")
      .run(senhaHash, provisoria ? 1 : 0, id);
  }

  administradoresAtivos() {
    return (this.db.prepare("SELECT count(*) AS n FROM usuarios WHERE perfil = 'ADMINISTRADOR' AND ativo = 1").get() as { n: number }).n;
  }
}

export class SqliteAuditoriaRepository implements AuditoriaRepository {
  constructor(private readonly db: DatabaseSync) {}

  registrar(quando: string, descricao: string) {
    this.db.prepare("INSERT INTO auditoria (quando, descricao) VALUES (?, ?)").run(quando, descricao);
  }

  recentes(limite: number) {
    return this.db
      .prepare("SELECT * FROM auditoria ORDER BY id DESC LIMIT ?")
      .all(limite)
      .map((l: Linha) => ({ id: l.id as number, quando: l.quando as string, descricao: l.descricao as string }));
  }
}

export class SqliteProfissionalRepository implements ProfissionalRepository {
  constructor(private readonly db: DatabaseSync) {}

  listar() {
    return this.db.prepare("SELECT * FROM profissionais WHERE ativo = 1 ORDER BY id").all().map(paraProfissional);
  }

  buscarPorId(id: number) {
    const l = this.db.prepare("SELECT * FROM profissionais WHERE id = ? AND ativo = 1").get(id);
    return l ? paraProfissional(l) : null;
  }
}

export class SqliteTutorRepository implements TutorRepository {
  constructor(private readonly db: DatabaseSync) {}

  private comAnimais(tutores: Tutor[]): TutorComAnimais[] {
    const animais = this.db.prepare("SELECT * FROM animais WHERE ativo = 1 ORDER BY id").all().map(paraAnimal);
    const porTutor = new Map<number, Animal[]>();
    for (const a of animais) porTutor.set(a.tutorId, [...(porTutor.get(a.tutorId) ?? []), a]);
    return tutores.map((t) => ({ ...t, animais: porTutor.get(t.id) ?? [] }));
  }

  listar(busca?: string) {
    const termo = (busca ?? "").trim();
    if (!termo) {
      return this.comAnimais(this.db.prepare("SELECT * FROM tutores WHERE ativo = 1 ORDER BY nome COLLATE NOCASE").all().map(paraTutor));
    }
    const texto = `%${termo.replace(/[%_]/g, "")}%`;
    // CPF e telefone só entram na busca quando o termo é numérico (ex.: "482" ou "(71) 99812").
    const digitos = /\p{L}/u.test(termo) ? "" : termo.replace(/\D/g, "");
    const numero = digitos.length >= 3 ? `%${digitos}%` : "";
    const linhas = this.db
      .prepare(
        `SELECT DISTINCT t.* FROM tutores t
           LEFT JOIN animais a ON a.tutor_id = t.id AND a.ativo = 1
          WHERE t.ativo = 1 AND (
                t.nome LIKE ? OR a.nome LIKE ?
             OR (? <> '' AND (t.cpf LIKE ?
                 OR replace(replace(replace(replace(t.telefone,'(',''),')',''),'-',''),' ','') LIKE ?)))
          ORDER BY t.nome COLLATE NOCASE`,
      )
      .all(texto, texto, numero, numero, numero);
    return this.comAnimais(linhas.map(paraTutor));
  }

  buscarPorId(id: number) {
    const l = this.db.prepare("SELECT * FROM tutores WHERE id = ? AND ativo = 1").get(id);
    if (!l) return null;
    const animais = this.db
      .prepare("SELECT * FROM animais WHERE tutor_id = ? AND ativo = 1 ORDER BY id")
      .all(id)
      .map(paraAnimal);
    return { ...paraTutor(l), animais };
  }

  buscarPorCpf(cpf: string) {
    const l = this.db.prepare("SELECT * FROM tutores WHERE cpf = ? AND ativo = 1").get(cpf);
    return l ? paraTutor(l) : null;
  }

  criar(d: Parameters<TutorRepository["criar"]>[0], criadoEm: string) {
    const r = this.db
      .prepare(
        "INSERT INTO tutores (nome, cpf, telefone, email, endereco, canal_whatsapp, canal_email, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(d.nome, d.cpf, d.telefone, d.email, d.endereco, d.canalWhatsapp ? 1 : 0, d.canalEmail ? 1 : 0, criadoEm);
    return Number(r.lastInsertRowid);
  }

  atualizar(id: number, d: Parameters<TutorRepository["atualizar"]>[1]) {
    this.db
      .prepare("UPDATE tutores SET nome = ?, telefone = ?, email = ?, endereco = ?, canal_whatsapp = ?, canal_email = ? WHERE id = ?")
      .run(d.nome, d.telefone, d.email, d.endereco, d.canalWhatsapp ? 1 : 0, d.canalEmail ? 1 : 0, id);
  }

  excluir(id: number) {
    emTransacao(this.db, () => {
      this.db.prepare("UPDATE animais SET ativo = 0 WHERE tutor_id = ?").run(id);
      this.db.prepare("UPDATE tutores SET ativo = 0 WHERE id = ?").run(id);
    });
  }

  total() {
    return (this.db.prepare("SELECT count(*) AS n FROM tutores WHERE ativo = 1").get() as { n: number }).n;
  }
}

export class SqliteAnimalRepository implements AnimalRepository {
  constructor(private readonly db: DatabaseSync) {}

  buscarPorId(id: number) {
    const l = this.db.prepare("SELECT * FROM animais WHERE id = ? AND ativo = 1").get(id);
    return l ? paraAnimal(l) : null;
  }

  criar(tutorId: number, d: Parameters<AnimalRepository["criar"]>[1]) {
    const r = this.db
      .prepare("INSERT INTO animais (tutor_id, nome, especie, raca, sexo, nascimento) VALUES (?, ?, ?, ?, ?, ?)")
      .run(tutorId, d.nome, d.especie, d.raca, d.sexo, d.nascimento);
    return Number(r.lastInsertRowid);
  }

  atualizar(id: number, d: Parameters<AnimalRepository["atualizar"]>[1]) {
    this.db
      .prepare("UPDATE animais SET nome = ?, especie = ?, raca = ?, sexo = ?, nascimento = ? WHERE id = ?")
      .run(d.nome, d.especie, d.raca, d.sexo, d.nascimento, id);
  }

  excluir(id: number) {
    this.db.prepare("UPDATE animais SET ativo = 0 WHERE id = ?").run(id);
  }

  total() {
    return (this.db.prepare("SELECT count(*) AS n FROM animais WHERE ativo = 1").get() as { n: number }).n;
  }
}

const SELECT_CONSULTA = `
  SELECT c.*, a.nome AS animal_nome, a.especie AS animal_especie, a.raca AS animal_raca,
         t.id AS tutor_id, t.nome AS tutor_nome, p.nome AS profissional_nome
    FROM consultas c
    JOIN animais a ON a.id = c.animal_id
    JOIN tutores t ON t.id = a.tutor_id
    JOIN profissionais p ON p.id = c.profissional_id`;

export class SqliteConsultaRepository implements ConsultaRepository {
  constructor(private readonly db: DatabaseSync) {}

  listar(f: Parameters<ConsultaRepository["listar"]>[0]) {
    const filtroProfissional = f.profissionalId ? "AND c.profissional_id = ?" : "";
    const parametros: (string | number)[] = [f.de, f.ate];
    if (f.profissionalId) parametros.push(f.profissionalId);
    return this.db
      .prepare(`${SELECT_CONSULTA} WHERE c.data BETWEEN ? AND ? ${filtroProfissional} ORDER BY c.data, c.hora, c.profissional_id`)
      .all(...parametros)
      .map(paraConsulta);
  }

  horariosOcupados(profissionalId: number, data: string) {
    return this.db
      .prepare("SELECT hora FROM consultas WHERE profissional_id = ? AND data = ? AND status <> 'Cancelada' ORDER BY hora")
      .all(profissionalId, data)
      .map((l: Linha) => l.hora as string);
  }

  existeParaAnimal(animalId: number, data: string, hora: string) {
    return !!this.db
      .prepare("SELECT 1 FROM consultas WHERE animal_id = ? AND data = ? AND hora = ? AND status <> 'Cancelada'")
      .get(animalId, data, hora);
  }

  criar(d: Parameters<ConsultaRepository["criar"]>[0], criadoPor: number, criadoEm: string) {
    try {
      const r = this.db
        .prepare(
          "INSERT INTO consultas (animal_id, profissional_id, data, hora, motivo, status, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, 'Agendada', ?, ?)",
        )
        .run(d.animalId, d.profissionalId, d.data, d.hora, d.motivo, criadoPor, criadoEm);
      return Number(r.lastInsertRowid);
    } catch (erro) {
      // Duas recepcionistas confirmando o mesmo horário ao mesmo tempo: o índice único decide.
      if (/UNIQUE constraint failed/.test(String((erro as Error)?.message))) {
        throw new ErroDeConflito("Horário indisponível. Escolha outro horário ou outro profissional.");
      }
      throw erro;
    }
  }

  buscarPorId(id: number) {
    const l = this.db.prepare(`${SELECT_CONSULTA} WHERE c.id = ?`).get(id);
    return l ? paraConsulta(l) : null;
  }

  cancelarFuturasDoTutor(tutorId: number, aPartirDe: string, hora: string) {
    const r = this.db
      .prepare(
        `UPDATE consultas SET status = 'Cancelada'
          WHERE status IN ('Agendada','Confirmada') AND (data > ? OR (data = ? AND hora > ?))
            AND animal_id IN (SELECT id FROM animais WHERE tutor_id = ?)`,
      )
      .run(aPartirDe, aPartirDe, hora, tutorId);
    return Number(r.changes);
  }

  cancelarFuturasDoAnimal(animalId: number, aPartirDe: string, hora: string) {
    const r = this.db
      .prepare(
        `UPDATE consultas SET status = 'Cancelada'
          WHERE status IN ('Agendada','Confirmada') AND (data > ? OR (data = ? AND hora > ?)) AND animal_id = ?`,
      )
      .run(aPartirDe, aPartirDe, hora, animalId);
    return Number(r.changes);
  }
}
