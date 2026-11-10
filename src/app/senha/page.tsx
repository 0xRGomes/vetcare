import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { Senha } from "@/ui/telas/Senha";

export const metadata: Metadata = { title: "Senha" };

export default async function Pagina() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  const destino = servicos().rbac.permissoes(sessao).inicio ? "/inicio" : "/agenda";
  return <Senha obrigatoria={sessao.trocarSenha} destino={destino} />;
}
