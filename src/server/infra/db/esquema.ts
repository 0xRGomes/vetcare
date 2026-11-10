// Camada de Infraestrutura — esquema relacional do VetCare (SQLite).

export const ESQUEMA = `
CREATE TABLE IF NOT EXISTS profissionais (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  crmv          TEXT NOT NULL UNIQUE,
  especialidade TEXT NOT NULL,
  dias          TEXT NOT NULL,              -- ex.: "1,2,3,4,5" (0 = domingo)
  hora_inicio   TEXT NOT NULL,
  hora_fim      TEXT NOT NULL,
  ativo         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usuarios (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash        TEXT NOT NULL,
  perfil            TEXT NOT NULL CHECK (perfil IN ('ADMINISTRADOR','RECEPCIONISTA','VETERINARIO')),
  ativo             INTEGER NOT NULL DEFAULT 1,
  tentativas_falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate     TEXT,
  profissional_id   INTEGER REFERENCES profissionais(id),
  senha_provisoria  INTEGER NOT NULL DEFAULT 0,
  ultimo_acesso     TEXT
);

CREATE TABLE IF NOT EXISTS auditoria (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  quando    TEXT NOT NULL,
  descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tutores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT NOT NULL,
  cpf            TEXT NOT NULL,
  telefone       TEXT NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  endereco       TEXT NOT NULL DEFAULT '',
  canal_whatsapp INTEGER NOT NULL DEFAULT 1,
  canal_email    INTEGER NOT NULL DEFAULT 1,
  criado_em      TEXT NOT NULL,
  ativo          INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tutores_cpf ON tutores(cpf) WHERE ativo = 1;

CREATE TABLE IF NOT EXISTS animais (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor_id   INTEGER NOT NULL REFERENCES tutores(id),
  nome       TEXT NOT NULL,
  especie    TEXT NOT NULL CHECK (especie IN ('Canina','Felina','Outra')),
  raca       TEXT NOT NULL DEFAULT '',
  sexo       TEXT NOT NULL CHECK (sexo IN ('Fêmea','Macho')),
  nascimento TEXT NOT NULL,
  ativo      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS ix_animais_tutor ON animais(tutor_id);

CREATE TABLE IF NOT EXISTS consultas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id       INTEGER NOT NULL REFERENCES animais(id),
  profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
  data            TEXT NOT NULL,            -- AAAA-MM-DD
  hora            TEXT NOT NULL,            -- HH:MM
  motivo          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Agendada',
  criado_por      INTEGER REFERENCES usuarios(id),
  criado_em       TEXT NOT NULL
);
-- Garante no banco que um profissional não tenha duas consultas ativas no mesmo horário (REQ 07).
CREATE UNIQUE INDEX IF NOT EXISTS ux_consultas_profissional_horario
  ON consultas(profissional_id, data, hora) WHERE status <> 'Cancelada';
CREATE UNIQUE INDEX IF NOT EXISTS ux_consultas_animal_horario
  ON consultas(animal_id, data, hora) WHERE status <> 'Cancelada';
CREATE INDEX IF NOT EXISTS ix_consultas_data ON consultas(data, hora);
`;

/** Colunas acrescentadas depois da primeira versão: [tabela, coluna, definição]. */
export const COLUNAS_NOVAS: [string, string, string][] = [
  ["usuarios", "senha_provisoria", "INTEGER NOT NULL DEFAULT 0"],
  ["usuarios", "ultimo_acesso", "TEXT"],
];
