import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { Veterinarios } from "@/ui/telas/Veterinarios";

export const metadata: Metadata = { title: "Veterinários" };

export default async function Pagina() {
  const sessao = await sessaoAtual();
  if (!sessao || !servicos().rbac.pode(sessao.perfil, "veterinarios", "ler")) redirect("/");
  return <Veterinarios />;
}
