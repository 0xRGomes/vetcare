// Camada de Aplicação (app.cadastros) — normalização de entradas.

/** Converte a entrada em texto sem espaços nas pontas, limitado a `max` caracteres. */
export function texto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.trim().replace(/\s+/g, " ").slice(0, max) : "";
}
