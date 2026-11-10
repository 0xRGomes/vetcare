// Tipos compartilhados com a interface (apenas tipos: nada do servidor entra no bundle do navegador).

export type { Agenda, ResumoDoDia } from "@/server/app/agendamento/AgendaQueryEngine";
export type { Horario } from "@/server/app/agendamento/SlotConflictManager";
export type { Permissoes } from "@/server/app/auth/RBACManager";
export type { TutorDTO as Tutor } from "@/server/app/cadastros/TutorService";
export type { Animal, ConsultaDetalhada as Consulta, Perfil, Profissional, Sessao, StatusConsulta } from "@/server/domain/modelos";
