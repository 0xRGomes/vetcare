// Camada de Domínio — entidades do modelo de negócio do VetCare.

export const PERFIS = ["ADMINISTRADOR", "RECEPCIONISTA", "VETERINARIO"] as const;
export type Perfil = (typeof PERFIS)[number];

export const ROTULO_PERFIL: Record<Perfil, string> = {
  ADMINISTRADOR: "Administrador",
  RECEPCIONISTA: "Recepcionista",
  VETERINARIO: "Veterinário",
};

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: Perfil;
  ativo: boolean;
  tentativasFalhas: number;
  bloqueadoAte: string | null;
  /** Preenchido quando o usuário é um veterinário da clínica. */
  profissionalId: number | null;
  /** A senha atual foi gerada pelo administrador e precisa ser trocada no próximo acesso. */
  senhaProvisoria: boolean;
  ultimoAcesso: string | null;
}

export type StatusUsuario = "Ativo" | "Bloqueado" | "Inativo";

/** Dados do usuário autenticado que circulam no token e na interface. */
export interface Sessao {
  usuarioId: number;
  nome: string;
  email: string;
  perfil: Perfil;
  profissionalId: number | null;
  /** Enquanto for true, o usuário só pode definir a própria senha. */
  trocarSenha: boolean;
}

export interface EventoDeAuditoria {
  id: number;
  quando: string;
  descricao: string;
}

export interface Profissional {
  id: number;
  nome: string;
  crmv: string;
  especialidade: string;
  /** Dias de atendimento: 0 = domingo … 6 = sábado. */
  dias: number[];
  horaInicio: string;
  horaFim: string;
}

export const ESPECIES = ["Canina", "Felina", "Outra"] as const;
export type Especie = (typeof ESPECIES)[number];
export const SEXOS = ["Fêmea", "Macho"] as const;
export type Sexo = (typeof SEXOS)[number];

export interface Animal {
  id: number;
  tutorId: number;
  nome: string;
  especie: Especie;
  raca: string;
  sexo: Sexo;
  nascimento: string;
}

export interface Tutor {
  id: number;
  nome: string;
  /** 11 dígitos, sem máscara. Nunca é enviado inteiro à interface. */
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  canalWhatsapp: boolean;
  canalEmail: boolean;
  criadoEm: string;
}

export interface TutorComAnimais extends Tutor {
  animais: Animal[];
}

export const STATUS_CONSULTA = ["Agendada", "Confirmada", "Aguardando", "Em atendimento", "Concluída", "Cancelada"] as const;
export type StatusConsulta = (typeof STATUS_CONSULTA)[number];

export const MOTIVOS_CONSULTA = ["Consulta de rotina", "Retorno", "Vacinação", "Emergência"] as const;
export type MotivoConsulta = (typeof MOTIVOS_CONSULTA)[number];

export interface Consulta {
  id: number;
  animalId: number;
  profissionalId: number;
  data: string;
  hora: string;
  motivo: MotivoConsulta;
  status: StatusConsulta;
}

/** Consulta com os dados de exibição da agenda. */
export interface ConsultaDetalhada extends Consulta {
  animal: { id: number; nome: string; especie: Especie; raca: string };
  tutor: { id: number; nome: string };
  profissional: { id: number; nome: string };
}

/** Duração padrão de uma consulta, em minutos. */
export const DURACAO_CONSULTA_MIN = 30;
