// Camada de Infraestrutura — relógio no fuso horário da clínica.

import type { Relogio } from "@/server/domain/repositorios";

const FUSO = process.env.VETCARE_TZ || "America/Bahia";

const formatador = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const relogioDoSistema: Relogio = {
  agora() {
    const instante = new Date();
    const p = Object.fromEntries(formatador.formatToParts(instante).map((x) => [x.type, x.value]));
    return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}`, instante };
  },
};
