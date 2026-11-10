import { redirect } from "next/navigation";
import { servicos } from "@/server/app/container";
import { sessaoAtual } from "@/server/http/sessao";
import { Casca } from "@/ui/Casca";

// Todas as telas internas exigem sessão válida (REQ 02).
export default async function LayoutInterno({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  return (
    <Casca sessao={sessao} permissoes={servicos().rbac.permissoes(sessao)}>
      {children}
    </Casca>
  );
}
