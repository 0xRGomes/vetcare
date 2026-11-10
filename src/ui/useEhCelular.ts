"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(max-width: 767px)";

function assinar(aoMudar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", aoMudar);
  return () => mq.removeEventListener("change", aoMudar);
}

/**
 * true no layout celular, false no desktop e null durante a renderização no
 * servidor (a largura da tela ainda não é conhecida).
 */
export function useEhCelular(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => null,
  );
}
