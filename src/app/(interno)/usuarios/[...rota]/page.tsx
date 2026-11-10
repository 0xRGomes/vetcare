import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { Usuarios } from "@/ui/telas/Usuarios";

export const metadata: Metadata = { title: "Usuários e perfis" };

// Atende /usuarios/novo e /usuarios/:id. Somente Administrador (Quadro 4).
export default async function Pagina() {
  const sessao = await sessaoAtual();
  if (sessao && !servicos().rbac.permissoes(sessao).usuarios) redirect("/");
  return <Usuarios />;
}
