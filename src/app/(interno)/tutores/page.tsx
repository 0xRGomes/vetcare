import type { Metadata } from "next";
import { Tutores } from "@/ui/telas/Tutores";

export const metadata: Metadata = { title: "Tutores e animais" };

export default function Pagina() {
  return <Tutores />;
}
