// Testes dos serviços de Aplicação sobre um banco SQLite em memória.
// Executar com: npm test

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { montarServicos, type Servicos } from "@/server/app/container";
import type { Sessao } from "@/server/domain/modelos";
import type { Relogio } from "@/server/domain/repositorios";
import { abrirBanco } from "@/server/infra/db/conexao";
import { carregarDadosIniciais, SENHA_DE_DEMONSTRACAO } from "@/server/infra/db/dados-iniciais";

// Terça-feira, 10/11/2026, 07:00 — antes da primeira consulta do dia.
const relogio: Relogio = { agora: () => ({ data: "2026-11-10", hora: "07:00", instante: new Date("2026-11-10T10:00:00Z") }) };
const AMANHA = "2026-11-11";

let s: Servicos;
let recepcao: Sessao;
let veterinario: Sessao;

async function entrar(email: string) {
  return (await s.auth.autenticar(email, SENHA_DE_DEMONSTRACAO)).sessao;
}

const status = (fn: () => unknown) => {
  try {
    fn();
  } catch (erro) {
    return (erro as { status?: number }).status;
  }
  return 200;
};

beforeEach(async () => {
  const db = abrirBanco(":memory:");
  carregarDadosIniciais(db, "2026-11-10", "07:00");
  s = montarServicos(db, relogio);
  recepcao = await entrar("marina.lopes@clinica.com.br");
  veterinario = await entrar("paulo.reis@clinica.com.br");
});

describe("REQ 02 — Autenticar usuário", () => {
  it("emite um token JWT válido para credenciais corretas", async () => {
    const { token, sessao } = await s.auth.autenticar("MARINA.LOPES@clinica.com.br", SENHA_DE_DEMONSTRACAO);
    assert.equal(sessao.perfil, "RECEPCIONISTA");
    assert.equal((await s.sessoes.validar(token)).usuarioId, sessao.usuarioId);
  });

  it("recusa senha errada, e-mail desconhecido e token adulterado", async () => {
    await assert.rejects(s.auth.autenticar("marina.lopes@clinica.com.br", "errada"), { status: 401 });
    await assert.rejects(s.auth.autenticar("ninguem@clinica.com.br", "x"), { status: 401 });
    await assert.rejects(s.sessoes.validar("a.b.c"), { status: 401 });
  });

  it("bloqueia o usuário após 5 tentativas incorretas", async () => {
    const email = "beatriz.santos@clinica.com.br";
    for (let i = 0; i < 4; i++) await assert.rejects(s.auth.autenticar(email, "errada"), { status: 401 });
    await assert.rejects(s.auth.autenticar(email, "errada"), { status: 423 });
    await assert.rejects(s.auth.autenticar(email, SENHA_DE_DEMONSTRACAO), { status: 423 });
  });
});

describe("REQ 04 — Manter tutor", () => {
  const dados = { nome: "Mariana Teixeira", cpf: "123.456.789-01", telefone: "(71) 98888-7777", email: "mari@email.com" };

  it("cadastra, mascara o CPF, edita e exclui", () => {
    const tutor = s.tutores.cadastrar(recepcao, dados);
    assert.equal(tutor.cpf, "***.456.***-01");
    assert.equal(s.tutores.atualizar(recepcao, tutor.id, { ...dados, endereco: "Rua Nova, 10" }).endereco, "Rua Nova, 10");
    s.tutores.excluir(recepcao, tutor.id);
    assert.equal(status(() => s.tutores.obter(recepcao, tutor.id)), 404);
  });

  it("valida os dados e recusa CPF duplicado", () => {
    assert.equal(status(() => s.tutores.cadastrar(recepcao, { ...dados, cpf: "123" })), 400);
    assert.equal(status(() => s.tutores.cadastrar(recepcao, { ...dados, nome: "" })), 400);
    s.tutores.cadastrar(recepcao, dados);
    assert.equal(status(() => s.tutores.cadastrar(recepcao, dados)), 409);
  });

  it("busca por nome do tutor, nome do animal e CPF", () => {
    assert.deepEqual(s.tutores.listar(recepcao, "souza").map((t) => t.nome), ["Ana Souza"]);
    assert.deepEqual(s.tutores.listar(recepcao, "thor").map((t) => t.nome), ["Ana Souza"]);
    assert.deepEqual(s.tutores.listar(recepcao, "317.482").map((t) => t.nome), ["Ana Souza"]);
  });

  it("veterinário lê, mas não altera (RBAC)", () => {
    assert.ok(s.tutores.listar(veterinario).length > 0);
    assert.equal(status(() => s.tutores.cadastrar(veterinario, dados)), 403);
    assert.equal(status(() => s.tutores.excluir(veterinario, 1)), 403);
  });
});

describe("REQ 05 — Manter animal", () => {
  const dados = { nome: "Rex", especie: "Canina", raca: "Poodle", sexo: "Macho", nascimento: "2022-05-10" };

  it("cadastra vinculado ao tutor, edita e exclui", () => {
    const animal = s.animais.cadastrar(recepcao, 1, dados);
    assert.equal(animal.tutorId, 1);
    assert.equal(s.animais.atualizar(recepcao, animal.id, { ...dados, raca: "Poodle Toy" }).raca, "Poodle Toy");
    s.animais.excluir(recepcao, animal.id);
    assert.ok(!s.tutores.obter(recepcao, 1).animais.some((a) => a.id === animal.id));
  });

  it("recusa data de nascimento no futuro e tutor inexistente", () => {
    assert.equal(status(() => s.animais.cadastrar(recepcao, 1, { ...dados, nascimento: "2027-01-10" })), 400);
    assert.equal(status(() => s.animais.cadastrar(recepcao, 9999, dados)), 404);
  });
});

describe("REQ 07 — Agendar consulta", () => {
  const pedido = { animalId: 1, profissionalId: 1, data: AMANHA, hora: "16:30", motivo: "Retorno" };

  it("agenda em horário livre e marca o horário como ocupado", () => {
    const consulta = s.agendamento.agendar(recepcao, pedido);
    assert.equal(consulta.status, "Agendada");
    const { horarios } = s.agendamento.horariosDisponiveis(recepcao, 1, AMANHA);
    assert.equal(horarios.find((h) => h.hora === "16:30")?.ocupado, true);
  });

  it("recusa conflito de horário do profissional e do animal", () => {
    s.agendamento.agendar(recepcao, pedido);
    assert.equal(status(() => s.agendamento.agendar(recepcao, { ...pedido, animalId: 2 })), 409);
    assert.equal(status(() => s.agendamento.agendar(recepcao, { ...pedido, profissionalId: 3 })), 409);
  });

  it("recusa horário passado, fora da jornada e dia sem atendimento", () => {
    assert.equal(status(() => s.agendamento.agendar(recepcao, { ...pedido, data: "2026-11-09" })), 409);
    assert.equal(status(() => s.agendamento.agendar(recepcao, { ...pedido, hora: "19:00" })), 409);
    assert.equal(status(() => s.agendamento.agendar(recepcao, { ...pedido, data: "2026-11-15" })), 409); // domingo
  });

  it("veterinário não agenda (RBAC)", () => {
    assert.equal(status(() => s.agendamento.agendar(veterinario, pedido)), 403);
  });

  it("excluir o tutor cancela as consultas futuras e libera o horário", () => {
    s.agendamento.agendar(recepcao, pedido);
    assert.ok(s.tutores.excluir(recepcao, 1).consultasCanceladas >= 1);
    const { horarios } = s.agendamento.horariosDisponiveis(recepcao, 1, AMANHA);
    assert.equal(horarios.find((h) => h.hora === "16:30")?.ocupado, false);
  });
});

describe("REQ 09 — Consultar agenda", () => {
  it("recepção consulta dia, semana e por profissional", () => {
    const dia = s.agenda.consultar(recepcao, "2026-11-10", "2026-11-10");
    assert.equal(dia.consultas.length, 11);
    assert.equal(dia.profissionais.length, 3);
    const semana = s.agenda.consultar(recepcao, "2026-11-09", "2026-11-15");
    assert.ok(semana.consultas.length > dia.consultas.length);
    const camila = s.agenda.consultar(recepcao, "2026-11-10", "2026-11-10", 2);
    assert.ok(camila.consultas.length > 0 && camila.consultas.every((c) => c.profissionalId === 2));
  });

  it("veterinário enxerga apenas a própria agenda", () => {
    const agenda = s.agenda.consultar(veterinario, "2026-11-09", "2026-11-15");
    assert.ok(agenda.consultas.length > 0 && agenda.consultas.every((c) => c.profissionalId === veterinario.profissionalId));
    assert.equal(status(() => s.agenda.consultar(veterinario, "2026-11-10", "2026-11-10", 2)), 403);
    assert.equal(status(() => s.agenda.resumoDoDia(veterinario)), 403);
  });

  it("resumo do dia traz totais e próximas consultas", () => {
    const resumo = s.agenda.resumoDoDia(recepcao);
    assert.equal(resumo.consultasHoje, 11);
    assert.equal(resumo.naSalaDeEspera, 1);
    assert.equal(resumo.proximas.length, 6);
    assert.equal(resumo.proximosDias.length, 3);
  });
});
