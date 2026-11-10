import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";

export default async function Raiz() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  redirect(servicos().rbac.permissoes(sessao).inicio ? "/inicio" : "/agenda");
}
