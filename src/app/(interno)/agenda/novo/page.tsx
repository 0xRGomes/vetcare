import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { NovoAgendamento } from "@/ui/telas/NovoAgendamento";

export const metadata: Metadata = { title: "Novo agendamento" };

export default async function Pagina() {
  const sessao = await sessaoAtual();
  if (sessao && !servicos().rbac.permissoes(sessao).agendar) redirect("/agenda");
  return <NovoAgendamento />;
}
