// Apaga o banco local. Na próxima inicialização o VetCare recria o esquema e os dados de demonstração.
// Uso: npm run db:reset (com o servidor parado)

import { rmSync } from "node:fs";
import { resolve } from "node:path";

const banco = resolve(process.cwd(), process.env.VETCARE_DB || "data/vetcare.db");
for (const sufixo of ["", "-wal", "-shm"]) rmSync(banco + sufixo, { force: true });
console.log(`Banco removido: ${banco}\nInicie o sistema (npm run dev) para recriá-lo com os dados de demonstração.`);
