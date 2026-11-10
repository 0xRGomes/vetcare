// Camada de Aplicação (app.agendamento) — REQ 09: Consultar agenda.

import { dataValida, diaDaSemana, somarDias } from "@/lib/datas";
import { ErroAcessoNegado, ErroDeValidacao } from "@/server/domain/erros";
import type { ConsultaDetalhada, Profissional, Sessao } from "@/server/domain/modelos";
import type { ConsultaRepository, ProfissionalRepository, Relogio, AnimalRepository, TutorRepository } from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";

const MAX_DIAS_POR_CONSULTA = 31;

export interface Agenda {
  hoje: string;
  horaAtual: string;
  de: string;
  ate: string;
  profissionais: Profissional[];
  consultas: ConsultaDetalhada[];
}

export interface ResumoDoDia {
  hoje: string;
  consultasHoje: number;
  profissionaisEmEscala: number;
  naSalaDeEspera: number;
  tutores: number;
  animais: number;
  proximas: ConsultaDetalhada[];
  escala: { id: number; nome: string; horaInicio: string; horaFim: string; consultas: number }[];
  proximosDias: { data: string; total: number }[];
}

export class AgendaQueryEngine {
  constructor(
    private readonly consultas: ConsultaRepository,
    private readonly profissionais: ProfissionalRepository,
    private readonly tutores: TutorRepository,
    private readonly animais: AnimalRepository,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  /**
   * Consultas de um período (dia, semana ou profissional). Para o perfil
   * Veterinário o resultado é sempre restrito à própria agenda.
   */
  consultar(sessao: Sessao, de: unknown, ate: unknown, profissionalId?: number): Agenda {
    this.rbac.exigir(sessao, "agenda", "ler");
    if (!dataValida(de) || !dataValida(ate) || ate < de) throw new ErroDeValidacao("Período inválido.");
    if (ate > somarDias(de, MAX_DIAS_POR_CONSULTA)) throw new ErroDeValidacao(`Consulte no máximo ${MAX_DIAS_POR_CONSULTA} dias por vez.`);

    const restricao = this.rbac.restricaoDeAgenda(sessao);
    if (restricao && profissionalId && profissionalId !== restricao) throw new ErroAcessoNegado("Você só pode consultar a própria agenda.");
    const filtro = restricao ?? profissionalId;

    const agora = this.relogio.agora();
    const todos = this.profissionais.listar();
    return {
      hoje: agora.data,
      horaAtual: agora.hora,
      de,
      ate,
      profissionais: restricao ? todos.filter((p) => p.id === restricao) : todos,
      consultas: this.consultas.listar({ de, ate, profissionalId: filtro }),
    };
  }

  /** Painel da tela Início (recepção e administração). */
  resumoDoDia(sessao: Sessao): ResumoDoDia {
    this.rbac.exigir(sessao, "agenda", "ler");
    if (this.rbac.restricaoDeAgenda(sessao)) throw new ErroAcessoNegado();

    const { data: hoje, hora } = this.relogio.agora();
    const fim = somarDias(hoje, 7);
    const periodo = this.consultas.listar({ de: hoje, ate: fim }).filter((c) => c.status !== "Cancelada");
    const doDia = periodo.filter((c) => c.data === hoje);
    const emEscala = this.profissionais.listar().filter((p) => p.dias.includes(diaDaSemana(hoje)));

    // Próximas chegadas: quem já está na clínica e as consultas que ainda vão acontecer.
    const pendentes = periodo.filter(
      (c) => c.status !== "Concluída" && (c.data > hoje || c.hora >= hora || c.status === "Em atendimento" || c.status === "Aguardando"),
    );
    const proximosDias: ResumoDoDia["proximosDias"] = [];
    for (let dia = somarDias(hoje, 1); proximosDias.length < 3 && dia <= fim; dia = somarDias(dia, 1)) {
      if (diaDaSemana(dia) !== 0) proximosDias.push({ data: dia, total: periodo.filter((c) => c.data === dia).length });
    }

    return {
      hoje,
      consultasHoje: doDia.length,
      profissionaisEmEscala: emEscala.length,
      naSalaDeEspera: doDia.filter((c) => c.status === "Aguardando").length,
      tutores: this.tutores.total(),
      animais: this.animais.total(),
      proximas: pendentes.slice(0, 6),
      escala: emEscala.map((p) => ({
        id: p.id,
        nome: p.nome,
        horaInicio: p.horaInicio,
        horaFim: p.horaFim,
        consultas: doDia.filter((c) => c.profissionalId === p.id).length,
      })),
      proximosDias,
    };
  }
}
