// Camada de Aplicação (app.cadastros) — REQ 05: Manter animal.

import { dataValida } from "@/lib/datas";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/domain/erros";
import { ESPECIES, SEXOS, type Animal, type Especie, type Sessao, type Sexo } from "@/server/domain/modelos";
import type { AnimalRepository, ConsultaRepository, DadosAnimal, Relogio, TutorRepository } from "@/server/domain/repositorios";
import type { RBACManager } from "@/server/app/auth/RBACManager";
import { texto } from "./validacao";

export class AnimalService {
  constructor(
    private readonly animais: AnimalRepository,
    private readonly tutores: TutorRepository,
    private readonly consultas: ConsultaRepository,
    private readonly rbac: RBACManager,
    private readonly relogio: Relogio,
  ) {}

  /** Todo animal nasce vinculado a um tutor existente. */
  cadastrar(sessao: Sessao, tutorId: number, entrada: Record<string, unknown>): Animal {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    if (!Number.isInteger(tutorId) || !this.tutores.buscarPorId(tutorId)) throw new ErroNaoEncontrado("Tutor não encontrado.");
    const id = this.animais.criar(tutorId, this.validar(entrada));
    return this.animais.buscarPorId(id)!;
  }

  atualizar(sessao: Sessao, id: number, entrada: Record<string, unknown>): Animal {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    this.existente(id);
    this.animais.atualizar(id, this.validar(entrada));
    return this.animais.buscarPorId(id)!;
  }

  excluir(sessao: Sessao, id: number): { consultasCanceladas: number } {
    this.rbac.exigir(sessao, "tutores-e-animais", "escrever");
    this.existente(id);
    const { data, hora } = this.relogio.agora();
    const consultasCanceladas = this.consultas.cancelarFuturasDoAnimal(id, data, hora);
    this.animais.excluir(id);
    return { consultasCanceladas };
  }

  private existente(id: number): Animal {
    const animal = Number.isInteger(id) ? this.animais.buscarPorId(id) : null;
    if (!animal) throw new ErroNaoEncontrado("Animal não encontrado.");
    return animal;
  }

  private validar(e: Record<string, unknown>): DadosAnimal {
    const nome = texto(e.nome, 60);
    if (!nome) throw new ErroDeValidacao("Informe o nome do animal.", "nome");
    if (!ESPECIES.includes(e.especie as Especie)) throw new ErroDeValidacao("Selecione a espécie.", "especie");
    if (!SEXOS.includes(e.sexo as Sexo)) throw new ErroDeValidacao("Selecione o sexo.", "sexo");
    if (!dataValida(e.nascimento)) throw new ErroDeValidacao("Informe a data de nascimento.", "nascimento");
    if (e.nascimento > this.relogio.agora().data) throw new ErroDeValidacao("A data não pode estar no futuro.", "nascimento");
    if (e.nascimento < "1980-01-01") throw new ErroDeValidacao("Confira a data de nascimento.", "nascimento");
    return { nome, especie: e.especie as Especie, raca: texto(e.raca, 60), sexo: e.sexo as Sexo, nascimento: e.nascimento };
  }
}
