// Camada de Infraestrutura — carga inicial de dados de demonstração.
//
// Contas iniciais: o sistema precisa de ao menos um administrador para que os demais usuários
// sejam cadastrados pela tela "Usuários e perfis" (REQ 01).
// REQ 06 (Manter veterinário) está fora do escopo da Etapa 2 (ADR-008): os profissionais são
// pré-cadastrados aqui, junto com tutores, animais e consultas de exemplo para a agenda não começar vazia.

import type { DatabaseSync } from "node:sqlite";
import { diaDaSemana, minutos, somarDias } from "@/lib/datas";
import { gerarHashSync } from "@/server/infra/security/senha";
import { emTransacao } from "./conexao";

export const SENHA_DE_DEMONSTRACAO = "vetcare123";

export const USUARIOS_DE_DEMONSTRACAO = [
  { nome: "Marina Lopes", email: "marina.lopes@clinica.com.br", perfil: "RECEPCIONISTA", crmv: null },
  { nome: "Dr. Paulo Reis", email: "paulo.reis@clinica.com.br", perfil: "VETERINARIO", crmv: "04821" },
  { nome: "Beatriz Santos", email: "beatriz.santos@clinica.com.br", perfil: "ADMINISTRADOR", crmv: null },
] as const;

const PROFISSIONAIS = [
  { nome: "Dr. Paulo Reis", crmv: "04821", especialidade: "Clínica geral", dias: [1, 2, 3, 4, 5], inicio: "08:00", fim: "17:00" },
  { nome: "Dra. Camila Andrade", crmv: "05310", especialidade: "Dermatologia", dias: [1, 2, 3, 4, 5], inicio: "08:00", fim: "14:00" },
  { nome: "Dr. Rafael Nunes", crmv: "03977", especialidade: "Cirurgia", dias: [1, 2, 3, 4, 5, 6], inicio: "11:00", fim: "18:00" },
];

type AnimalSeed = [nome: string, especie: "Canina" | "Felina" | "Outra", raca: string, sexo: "Fêmea" | "Macho", nascimento: string];

const TUTORES: { nome: string; cpf: string; tel: string; email: string; end: string; desde: string; wa: boolean; em: boolean; animais: AnimalSeed[] }[] = [
  { nome: "Ana Souza", cpf: "31748205910", tel: "(71) 99812-4410", email: "ana.souza@email.com", end: "Rua das Hortênsias, 120 · Pituba, Salvador", desde: "2023-03-14", wa: true, em: true,
    animais: [["Thor", "Canina", "Labrador", "Macho", "2021-02-04"], ["Mia", "Felina", "SRD", "Fêmea", "2024-07-18"]] },
  { nome: "Carlos Menezes", cpf: "20411563872", tel: "(71) 98745-2210", email: "carlos.m@email.com", end: "Av. Sete de Setembro, 880 · Centro, Salvador", desde: "2024-08-02", wa: true, em: false,
    animais: [["Mel", "Felina", "SRD", "Fêmea", "2022-11-11"]] },
  { nome: "Fernanda Costa", cpf: "58290317645", tel: "(71) 99230-7781", email: "fe.costa@email.com", end: "Rua Ceará, 45 · Rio Vermelho, Salvador", desde: "2025-01-20", wa: false, em: true,
    animais: [["Luna", "Felina", "Siamês", "Fêmea", "2020-05-02"]] },
  { nome: "Juliana Prado", cpf: "74632109508", tel: "(71) 98111-0034", email: "ju.prado@email.com", end: "Rua Chile, 12 · Barra, Salvador", desde: "2022-06-09", wa: true, em: true,
    animais: [["Pipoca", "Canina", "Shih-tzu", "Fêmea", "2019-09-30"]] },
  { nome: "Patrícia Alves", cpf: "86577430261", tel: "(71) 99654-3320", email: "patricia.a@email.com", end: "Rua da Paz, 300 · Graça, Salvador", desde: "2026-02-11", wa: true, em: false,
    animais: [["Nina", "Outra", "Coelho Mini Lop", "Fêmea", "2025-03-14"]] },
  { nome: "Roberto Lima", cpf: "49155687329", tel: "(71) 98877-6611", email: "roberto.l@email.com", end: "Av. Paralela, 2100 · Imbuí, Salvador", desde: "2021-10-05", wa: true, em: true,
    animais: [["Bob", "Canina", "SRD", "Macho", "2018-01-20"]] },
  { nome: "Sônia Ribeiro", cpf: "63208741955", tel: "(71) 99102-5567", email: "sonia.ribeiro@email.com", end: "Rua Amazonas, 78 · Pituba, Salvador", desde: "2023-11-23", wa: true, em: true,
    animais: [["Max", "Canina", "Golden Retriever", "Macho", "2020-08-15"]] },
  { nome: "Igor Matos", cpf: "17594620834", tel: "(71) 98420-1198", email: "igor.matos@email.com", end: "Rua Bahia, 510 · Brotas, Salvador", desde: "2024-04-17", wa: true, em: false,
    animais: [["Fred", "Canina", "Bulldog Francês", "Macho", "2022-03-09"]] },
  { nome: "Lívia Rocha", cpf: "95013862740", tel: "(71) 99745-8802", email: "livia.rocha@email.com", end: "Al. das Espatódeas, 33 · Caminho das Árvores, Salvador", desde: "2025-06-30", wa: true, em: true,
    animais: [["Kiara", "Felina", "Persa", "Fêmea", "2021-12-01"]] },
  { nome: "Marcos Dias", cpf: "28466971053", tel: "(71) 98633-4471", email: "marcos.dias@email.com", end: "Rua Direta, 9 · Itapuã, Salvador", desde: "2022-01-12", wa: false, em: true,
    animais: [["Zeca", "Canina", "Vira-lata", "Macho", "2017-06-22"]] },
  { nome: "Débora Lins", cpf: "50739218466", tel: "(71) 99988-2013", email: "debora.lins@email.com", end: "Rua Pará, 204 · Pituba, Salvador", desde: "2025-09-08", wa: true, em: true,
    animais: [["Amora", "Felina", "Maine Coon", "Fêmea", "2023-04-27"]] },
];

/** Consultas do primeiro dia: [hora, índice do profissional, animal, status]. */
const DIA_INICIAL: [string, number, string, string][] = [
  ["08:00", 0, "Max", "Confirmada"], ["08:00", 1, "Fred", "Confirmada"],
  ["08:30", 1, "Kiara", "Confirmada"],
  ["09:00", 0, "Thor", "Em atendimento"], ["09:30", 1, "Mel", "Aguardando"],
  ["10:00", 0, "Pipoca", "Confirmada"], ["10:30", 1, "Luna", "Agendada"],
  ["11:00", 2, "Bob", "Agendada"], ["11:30", 0, "Nina", "Confirmada"],
  ["12:00", 2, "Zeca", "Agendada"], ["12:00", 1, "Amora", "Confirmada"],
];

const HORAS_DOS_DEMAIS_DIAS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:30"];

export function bancoVazio(db: DatabaseSync): boolean {
  return (db.prepare("SELECT count(*) AS n FROM usuarios").get() as { n: number }).n === 0;
}

export function carregarDadosIniciais(db: DatabaseSync, hoje: string, horaAtual: string): void {
  emTransacao(db, () => {
    const insProf = db.prepare("INSERT INTO profissionais (nome, crmv, especialidade, dias, hora_inicio, hora_fim) VALUES (?, ?, ?, ?, ?, ?)");
    const profs = PROFISSIONAIS.map((p) => ({ ...p, id: Number(insProf.run(p.nome, p.crmv, p.especialidade, p.dias.join(","), p.inicio, p.fim).lastInsertRowid) }));

    const hash = gerarHashSync(SENHA_DE_DEMONSTRACAO);
    const insUsuario = db.prepare("INSERT INTO usuarios (nome, email, senha_hash, perfil, profissional_id) VALUES (?, ?, ?, ?, ?)");
    const ids: number[] = [];
    for (const u of USUARIOS_DE_DEMONSTRACAO) {
      const prof = profs.find((p) => p.crmv === u.crmv);
      ids.push(Number(insUsuario.run(u.nome, u.email, hash, u.perfil, prof ? prof.id : null).lastInsertRowid));
    }
    const recepcionista = ids[0];

    const insTutor = db.prepare("INSERT INTO tutores (nome, cpf, telefone, email, endereco, canal_whatsapp, canal_email, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const insAnimal = db.prepare("INSERT INTO animais (tutor_id, nome, especie, raca, sexo, nascimento) VALUES (?, ?, ?, ?, ?, ?)");
    const animais: { id: number; nome: string }[] = [];
    for (const t of TUTORES) {
      const tutorId = Number(insTutor.run(t.nome, t.cpf, t.tel, t.email, t.end, t.wa ? 1 : 0, t.em ? 1 : 0, t.desde).lastInsertRowid);
      for (const [nome, especie, raca, sexo, nascimento] of t.animais) {
        animais.push({ id: Number(insAnimal.run(tutorId, nome, especie, raca, sexo, nascimento).lastInsertRowid), nome });
      }
    }

    const insConsulta = db.prepare(
      "INSERT INTO consultas (animal_id, profissional_id, data, hora, motivo, status, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const atende = (p: (typeof profs)[number], data: string, hora: string) =>
      p.dias.includes(diaDaSemana(data)) && minutos(hora) >= minutos(p.inicio) && minutos(hora) < minutos(p.fim);

    // Primeiro dia: hoje ou, se hoje for domingo, a segunda-feira seguinte.
    let dia = hoje;
    while (diaDaSemana(dia) === 0) dia = somarDias(dia, 1);
    for (const [hora, iProf, nome, status] of DIA_INICIAL) {
      const prof = profs[iProf];
      if (!atende(prof, dia, hora)) continue;
      const passou = dia === hoje && minutos(hora) + 60 <= minutos(horaAtual);
      const animal = animais.find((a) => a.nome === nome)!;
      insConsulta.run(animal.id, prof.id, dia, hora, "Consulta de rotina", passou ? "Concluída" : status, recepcionista, hoje);
    }

    // Cinco dias úteis seguintes, com menos consultas.
    let rodizio = 0;
    for (let n = 0; n < 5; n++) {
      do dia = somarDias(dia, 1);
      while (diaDaSemana(dia) === 0);
      for (const hora of HORAS_DOS_DEMAIS_DIAS) {
        const prof = [0, 1, 2].map((k) => profs[(rodizio + k) % 3]).find((p) => atende(p, dia, hora));
        if (!prof) continue;
        const animal = animais[(rodizio * 5 + 3) % animais.length];
        const motivo = ["Consulta de rotina", "Retorno", "Vacinação"][rodizio % 3];
        try {
          insConsulta.run(animal.id, prof.id, dia, hora, motivo, rodizio % 2 ? "Confirmada" : "Agendada", recepcionista, hoje);
        } catch {
          // horário já ocupado para o animal ou profissional: segue para o próximo
        }
        rodizio++;
      }
    }
  });
}
