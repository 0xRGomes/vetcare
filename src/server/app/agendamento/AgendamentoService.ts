// Camada de Aplicação (app.agendamento) — REQ 07: Agendar consulta.

import { dataValida, horaValida } from "@/lib/datas";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/domain/erros";
import { MOTIVOS_CONSULTA, type ConsultaDetalhada, type MotivoConsulta, type Sessao } from "@/server/domain/modelos";
import type { AnimalRepository, ConsultaRepository, ProfissionalRepository, Relogio } from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";
import type { Horario, SlotConflictManager } from "./SlotConflictManager";

export class AgendamentoService {
  constructor(
    private readonly consultas: ConsultaRepository,
    private readonly animais: AnimalRepository,
    private readonly profissionais: ProfissionalRepository,
    private readonly conflitos: SlotConflictManager,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  /** Horários de um profissional em uma data, marcando os ocupados. */
  horariosDisponiveis(sessao: Sessao, profissionalId: number, data: unknown): { atende: boolean; horarios: Horario[] } {
    this.rbac.exigir(sessao, "agenda", "escrever");
    if (!dataValida(data)) throw new ErroDeValidacao("Data inválida.", "data");
    const profissional = this.profissional(profissionalId);
    return { atende: this.conflitos.atendeNoDia(profissional, data), horarios: this.conflitos.horarios(profissional, data) };
  }

  agendar(sessao: Sessao, entrada: Record<string, unknown>): ConsultaDetalhada {
    this.rbac.exigir(sessao, "agenda", "escrever");
    const { data, hora } = entrada;
    if (!dataValida(data)) throw new ErroDeValidacao("Informe a data da consulta.", "data");
    if (!horaValida(hora)) throw new ErroDeValidacao("Escolha um horário.", "hora");
    const motivo = (entrada.motivo ?? MOTIVOS_CONSULTA[0]) as MotivoConsulta;
    if (!MOTIVOS_CONSULTA.includes(motivo)) throw new ErroDeValidacao("Motivo inválido.", "motivo");

    const animalId = Number(entrada.animalId);
    const animal = Number.isInteger(animalId) ? this.animais.buscarPorId(animalId) : null;
    if (!animal) throw new ErroNaoEncontrado("Animal não encontrado. Cadastre o animal antes de agendar.");
    const profissional = this.profissional(Number(entrada.profissionalId));

    const impedimento = this.conflitos.impedimento(profissional, data, hora);
    if (impedimento) throw new ErroDeConflito(impedimento);
    if (this.consultas.existeParaAnimal(animal.id, data, hora)) {
      throw new ErroDeConflito(`${animal.nome} já tem outra consulta neste horário.`);
    }

    const id = this.consultas.criar(
      { animalId: animal.id, profissionalId: profissional.id, data, hora, motivo },
      sessao.usuarioId,
      this.relogio.agora().instante.toISOString(),
    );
    return this.consultas.buscarPorId(id)!;
  }

  cancelar(sessao: Sessao, id: number): ConsultaDetalhada {
    this.rbac.exigir(sessao, "agenda", "escrever");
    if (!Number.isInteger(id) || id < 1) throw new ErroDeValidacao("Consulta inválida.", "id");

    const consulta = this.consultas.buscarPorId(id);
    if (!consulta) throw new ErroNaoEncontrado("Consulta não encontrada.");
    if (consulta.status !== "Agendada" && consulta.status !== "Confirmada") {
      throw new ErroDeConflito("Esta consulta não pode ser cancelada.");
    }

    const agora = this.relogio.agora();
    if (consulta.data < agora.data || (consulta.data === agora.data && consulta.hora <= agora.hora)) {
      throw new ErroDeConflito("Não é possível cancelar uma consulta que já passou.");
    }
    if (!this.consultas.cancelar(id)) throw new ErroDeConflito("A consulta não pode mais ser cancelada.");
    return this.consultas.buscarPorId(id)!;
  }

  private profissional(id: number) {
    const profissional = Number.isInteger(id) ? this.profissionais.buscarPorId(id) : null;
    if (!profissional) throw new ErroNaoEncontrado("Profissional não encontrado.");
    return profissional;
  }
}
