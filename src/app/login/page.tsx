import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/server/http/sessao";
import { SENHA_DE_DEMONSTRACAO, USUARIOS_DE_DEMONSTRACAO } from "@/server/infra/db/dados-iniciais";
import { Login } from "@/ui/telas/Login";

export const metadata: Metadata = { title: "Entrar" };

export default async function Pagina() {
  if (await sessaoAtual()) redirect("/");
  // Os atalhos de demonstração só aparecem quando os dados de exemplo estão habilitados.
  const demo =
    process.env.VETCARE_SEED === "0"
      ? []
      : USUARIOS_DE_DEMONSTRACAO.map((u) => ({ perfil: u.perfil, email: u.email, senha: SENHA_DE_DEMONSTRACAO }));
  return <Login demo={demo} />;
}
