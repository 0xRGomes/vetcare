import type { Metadata } from "next";
import { Tutores } from "@/ui/telas/Tutores";

export const metadata: Metadata = { title: "Tutores e animais" };

// Atende /tutores/novo, /tutores/:id, /tutores/:id/editar e /tutores/:id/animais/(novo|:animal).
// A lista (/tutores) fica em ../page.tsx; as duas páginas mostram a mesma tela.
export default function Pagina() {
  return <Tutores />;
}
