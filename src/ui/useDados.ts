"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, mensagemDe } from "./api";

interface Estado<T> {
  /** Endereço a que `dados` pertence. */
  url: string | null;
  dados: T | null;
  erro: string;
  carregando: boolean;
  /** Horário (HH:MM:SS) da última atualização bem-sucedida. */
  atualizadoAs: string;
}

// Última resposta de cada endereço. Ao trocar de tela e voltar, o conteúdo anterior aparece
// na hora e é atualizado em seguida. Entrar e sair recarregam a página, o que esvazia a memória.
const memoria = new Map<string, unknown>();

/**
 * Busca dados da API e os mantém atualizados: recarrega quando a URL muda,
 * a cada `intervalo` ms (se informado) e quando a aba volta a ficar visível.
 */
export function useDados<T>(url: string | null, intervalo?: number) {
  const [estado, setEstado] = useState<Estado<T>>(() => ({
    url,
    dados: url ? ((memoria.get(url) as T | undefined) ?? null) : null,
    erro: "",
    carregando: !!url,
    atualizadoAs: "",
  }));
  const pedido = useRef(0);

  const recarregar = useCallback(async () => {
    if (!url) return;
    const meu = ++pedido.current;
    try {
      const dados = await api<T>(url);
      memoria.set(url, dados);
      if (meu !== pedido.current) return; // chegou uma resposta mais antiga
      setEstado({ url, dados, erro: "", carregando: false, atualizadoAs: new Date().toLocaleTimeString("pt-BR") });
    } catch (e) {
      if (meu !== pedido.current) return;
      setEstado((anterior) => ({ ...anterior, url, erro: mensagemDe(e), carregando: false }));
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

  // Enquanto a resposta do novo endereço não chega, vale a memória dele ou, na falta, o que já estava na tela.
  const doEndereco = estado.url === url;
  const dados = doEndereco ? estado.dados : url ? ((memoria.get(url) as T | undefined) ?? estado.dados) : null;
  return { dados, erro: doEndereco ? estado.erro : "", carregando: doEndereco ? estado.carregando : !!url, atualizadoAs: estado.atualizadoAs, recarregar };
}
