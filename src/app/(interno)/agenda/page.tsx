import type { Metadata } from "next";
import { Agenda } from "@/ui/telas/Agenda";

export const metadata: Metadata = { title: "Agenda" };

export default function Pagina() {
  return <Agenda />;
}
