import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { Inicio } from "@/ui/telas/Inicio";

export const metadata: Metadata = { title: "Início" };

export default async function Pagina() {
  const sessao = await sessaoAtual();
  // Veterinários não têm painel de recepção: vão direto para a própria agenda.
  if (sessao && !servicos().rbac.permissoes(sessao).inicio) redirect("/agenda");
  return <Inicio />;
}
