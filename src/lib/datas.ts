// Utilitários de data sem dependência de fuso do navegador.
// Datas trafegam como "AAAA-MM-DD" e horas como "HH:MM".

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function partes(iso: string): [number, number, number] {
  const [a, m, d] = iso.split("-").map(Number);
  return [a, m, d];
}

function paraUTC(iso: string): Date {
  const [a, m, d] = partes(iso);
  return new Date(Date.UTC(a, m - 1, d));
}

function deUTC(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function dataValida(iso: unknown): iso is string {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return deUTC(paraUTC(iso)) === iso;
}

export function horaValida(hora: unknown): hora is string {
  return typeof hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export function somarDias(iso: string, dias: number): string {
  const dt = paraUTC(iso);
  dt.setUTCDate(dt.getUTCDate() + dias);
  return deUTC(dt);
}

/** 0 = domingo … 6 = sábado */
export function diaDaSemana(iso: string): number {
  return paraUTC(iso).getUTCDay();
}

/** Segunda-feira da semana que contém a data. */
export function inicioDaSemana(iso: string): string {
  const d = diaDaSemana(iso);
  return somarDias(iso, d === 0 ? -6 : 1 - d);
}

export function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function horaDeMinutos(min: number): string {
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
}

export const nomeDoDia = (iso: string) => DIAS[diaDaSemana(iso)];
export const diaCurto = (iso: string) => DIAS_CURTOS[diaDaSemana(iso)];
export const diaDoMes = (iso: string) => partes(iso)[2];

/** "13/10" */
export function dataCurta(iso: string): string {
  const [, m, d] = partes(iso);
  return String(d).padStart(2, "0") + "/" + String(m).padStart(2, "0");
}

/** "13/10/2026" */
export function dataBR(iso: string): string {
  return dataCurta(iso) + "/" + partes(iso)[0];
}

/** "Terça-feira, 13 de outubro de 2026" */
export function dataPorExtenso(iso: string): string {
  const [a, m, d] = partes(iso);
  return `${nomeDoDia(iso)}, ${d} de ${MESES[m - 1]} de ${a}`;
}

/** "Terça, 13 de outubro" */
export function dataMedia(iso: string): string {
  const [, m, d] = partes(iso);
  return `${nomeDoDia(iso).replace("-feira", "")}, ${d} de ${MESES[m - 1]}`;
}

/** "mar/2023" */
export function mesAno(iso: string): string {
  const [a, m] = partes(iso);
  return `${MESES_CURTOS[m - 1]}/${a}`;
}

/** Idade legível a partir da data de nascimento. */
export function idade(nascimento: string, hoje: string): string {
  const [a1, m1, d1] = partes(nascimento);
  const [a2, m2, d2] = partes(hoje);
  let meses = (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (meses < 0) meses = 0;
  if (meses < 12) return meses === 1 ? "1 mês" : `${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

/** Data de hoje segundo o relógio local (usada pelo navegador antes da primeira resposta do servidor). */
export function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
