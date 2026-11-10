"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, mensagemDe } from "./api";

interface Estado<T> {
  dados: T | null;
  erro: string;
  carregando: boolean;
  /** Horário (HH:MM:SS) da última atualização bem-sucedida. */
  atualizadoAs: string;
}

/**
 * Busca dados da API e os mantém atualizados: recarrega quando a URL muda,
 * a cada `intervalo` ms (se informado) e quando a aba volta a ficar visível.
 */
export function useDados<T>(url: string | null, intervalo?: number) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: "", carregando: !!url, atualizadoAs: "" });
  const pedido = useRef(0);

  const recarregar = useCallback(async () => {
    if (!url) return;
    const meu = ++pedido.current;
    try {
      const dados = await api<T>(url);
      if (meu !== pedido.current) return; // chegou uma resposta mais antiga
      setEstado({ dados, erro: "", carregando: false, atualizadoAs: new Date().toLocaleTimeString("pt-BR") });
    } catch (e) {
      if (meu !== pedido.current) return;
      setEstado((anterior) => ({ ...anterior, erro: mensagemDe(e), carregando: false }));
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    void recarregar();
    const aoVoltar = () => document.visibilityState === "visible" && void recarregar();
    document.addEventListener("visibilitychange", aoVoltar);
    const timer = intervalo ? window.setInterval(recarregar, intervalo) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      if (timer) window.clearInterval(timer);
    };
  }, [url, intervalo, recarregar]);

  return { ...estado, recarregar };
}
