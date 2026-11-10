// Camada de Domínio — contratos de persistência e de segurança.
// A Infraestrutura implementa estas interfaces (inversão de dependência, ADR-005).

import type {
  Animal,
  Consulta,
  ConsultaDetalhada,
  Profissional,
  Sessao,
  Tutor,
  TutorComAnimais,
  Usuario,
} from "./modelos";

export interface UsuarioRepository {
  buscarPorEmail(email: string): Usuario | null;
  buscarPorId(id: number): Usuario | null;
  registrarFalhaDeLogin(id: number, tentativas: number, bloqueadoAte: string | null): void;
  limparFalhasDeLogin(id: number): void;
}

export interface ProfissionalRepository {
  listar(): Profissional[];
  buscarPorId(id: number): Profissional | null;
}

export type DadosTutor = Omit<Tutor, "id" | "criadoEm">;
export type DadosAnimal = Omit<Animal, "id" | "tutorId">;

export interface TutorRepository {
  listar(busca?: string): TutorComAnimais[];
  buscarPorId(id: number): TutorComAnimais | null;
  buscarPorCpf(cpf: string): Tutor | null;
  criar(dados: DadosTutor, criadoEm: string): number;
  atualizar(id: number, dados: Omit<DadosTutor, "cpf">): void;
  /** Exclusão lógica do tutor e de seus animais; o histórico é preservado. */
  excluir(id: number): void;
  total(): number;
}

export interface AnimalRepository {
  buscarPorId(id: number): Animal | null;
  criar(tutorId: number, dados: DadosAnimal): number;
  atualizar(id: number, dados: DadosAnimal): void;
  excluir(id: number): void;
  total(): number;
}

export interface FiltroAgenda {
  de: string;
  ate: string;
  profissionalId?: number;
}

export interface ConsultaRepository {
  listar(filtro: FiltroAgenda): ConsultaDetalhada[];
  /** Horários ativos (não cancelados) de um profissional em uma data. */
  horariosOcupados(profissionalId: number, data: string): string[];
  existeParaAnimal(animalId: number, data: string, hora: string): boolean;
  /** Lança ErroDeConflito se o horário do profissional já estiver ocupado. */
  criar(dados: Omit<Consulta, "id" | "status">, criadoPor: number, criadoEm: string): number;
  buscarPorId(id: number): ConsultaDetalhada | null;
  cancelarFuturasDoTutor(tutorId: number, aPartirDe: string, hora: string): number;
  cancelarFuturasDoAnimal(animalId: number, aPartirDe: string, hora: string): number;
}

export interface HashDeSenha {
  gerar(senha: string): Promise<string>;
  conferir(senha: string, hash: string): Promise<boolean>;
}

export interface EmissorDeToken {
  emitir(sessao: Sessao): Promise<string>;
  /** Retorna null quando o token é inválido ou expirou. */
  verificar(token: string): Promise<Sessao | null>;
  readonly validadeEmSegundos: number;
}

export interface Relogio {
  /** Data e hora atuais no fuso da clínica. */
  agora(): { data: string; hora: string; instante: Date };
}
