// Camada de Aplicação (app.agendamento) — horários de atendimento e conflitos (REQ 07).

import { diaDaSemana, horaDeMinutos, minutos } from "@/lib/datas";
import { DURACAO_CONSULTA_MIN, type Profissional } from "@/server/domain/modelos";
import type { ConsultaRepository, Relogio } from "@/server/domain/repositorios";

export interface Horario {
  hora: string;
  /** Já existe consulta ativa do profissional neste horário. */
  ocupado: boolean;
  /** O horário já passou (só ocorre na data de hoje). */
  passado: boolean;
}

export class SlotConflictManager {
  constructor(
    private readonly consultas: ConsultaRepository,
    private readonly relogio: Relogio,
  ) {}

  atendeNoDia(profissional: Profissional, data: string): boolean {
    return profissional.dias.includes(diaDaSemana(data));
  }

  /** Horários de início possíveis dentro da jornada do profissional. */
  grade(profissional: Profissional): string[] {
    const horas: string[] = [];
    for (let m = minutos(profissional.horaInicio); m + DURACAO_CONSULTA_MIN <= minutos(profissional.horaFim); m += DURACAO_CONSULTA_MIN) {
      horas.push(horaDeMinutos(m));
    }
    return horas;
  }

  horarios(profissional: Profissional, data: string): Horario[] {
    if (!this.atendeNoDia(profissional, data)) return [];
    const ocupados = new Set(this.consultas.horariosOcupados(profissional.id, data));
    const agora = this.relogio.agora();
    return this.grade(profissional).map((hora) => ({
      hora,
      ocupado: ocupados.has(hora),
      passado: data < agora.data || (data === agora.data && hora <= agora.hora),
    }));
  }

  /** Motivo pelo qual o horário não pode ser usado, ou null se está livre. */
  impedimento(profissional: Profissional, data: string, hora: string): string | null {
    if (!this.atendeNoDia(profissional, data)) return `${profissional.nome} não atende nesta data.`;
    const horario = this.horarios(profissional, data).find((h) => h.hora === hora);
    if (!horario) return `${profissional.nome} atende das ${profissional.horaInicio} às ${profissional.horaFim}.`;
    if (horario.passado) return "Não é possível agendar em um horário que já passou.";
    if (horario.ocupado) return `Horário indisponível. ${profissional.nome} já tem consulta às ${hora}.`;
    return null;
  }
}
