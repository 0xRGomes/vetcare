import type { StatusConsulta } from "./tipos";

/** Cores [fundo, texto] de cada situação da consulta, como no protótipo. */
export const CORES_DO_STATUS: Record<StatusConsulta, [string, string]> = {
  "Em atendimento": ["#E6EBFF", "#2B3FB3"],
  Aguardando: ["#E1F3FE", "#075985"],
  Confirmada: ["#E4F1DC", "#2F5D1E"],
  Agendada: ["#F1F3F7", "#3D4A63"],
  Concluída: ["#ECEFF5", "#5B6782"],
  Cancelada: ["#FDECEC", "#9B1C1C"],
};

export function corDoStatus(status: StatusConsulta) {
  const [background, color] = CORES_DO_STATUS[status];
  return { background, color };
}

export function iniciais(nome: string): string {
  return nome
    .replace(/^(Dra?\.)\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
