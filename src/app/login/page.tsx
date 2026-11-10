import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/server/http/sessao";
import { Login } from "@/ui/telas/Login";

export const metadata: Metadata = { title: "Entrar" };

export default async function Pagina() {
  if (await sessaoAtual()) redirect("/");
  return <Login />;
}
