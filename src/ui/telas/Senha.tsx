"use client";

// Definição da própria senha: obrigatória no primeiro acesso (senha provisória) e disponível em "Alterar senha".

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, ErroApi, mensagemDe, recarregarEm } from "../api";
import { MolduraDeAcesso } from "../MolduraDeAcesso";

const MINIMO = 8;

export function Senha({ obrigatoria, destino }: { obrigatoria: boolean; destino: string }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<{ campo?: string; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!atual) return setErro({ campo: "senhaAtual", texto: obrigatoria ? "Informe a senha provisória que você recebeu." : "Informe a senha atual." });
    if (nova.length < MINIMO) return setErro({ campo: "novaSenha", texto: `A nova senha precisa ter pelo menos ${MINIMO} caracteres.` });
    if (nova !== confirmacao) return setErro({ campo: "confirmacao", texto: "A confirmação não é igual à nova senha." });
    setErro(null);
    setEnviando(true);
    try {
      await api("/api/auth/senha", { metodo: "POST", corpo: { senhaAtual: atual, novaSenha: nova } });
      if (obrigatoria) recarregarEm(destino);
      else setPronto(true);
    } catch (e) {
      setErro({ campo: e instanceof ErroApi ? e.campo : undefined, texto: mensagemDe(e) });
    } finally {
      setEnviando(false);
    }
  }

  const campo = (id: string, rotulo: string, valor: string, mudar: (v: string) => void, auto: string) => (
    <div className="field">
      <label className="lbl" htmlFor={id}>
        {rotulo}
      </label>
      <input className="inp" id={id} type="password" autoComplete={auto} value={valor} aria-invalid={erro?.campo === id || undefined} onChange={(e) => mudar(e.target.value)} />
    </div>
  );

  return (
    <MolduraDeAcesso>
      {(celular) =>
        pronto ? (
          <div className={celular ? "stack" : "lg-form"}>
            <h1 className={celular ? "h1" : undefined}>Senha alterada</h1>
            <p className="sub">Use a nova senha no próximo acesso.</p>
            <Link className={celular ? "btn" : "entrar link"} href={destino}>
              Voltar ao sistema
            </Link>
          </div>
        ) : (
          <form className={celular ? "stack" : "lg-form"} aria-label="Definir senha" onSubmit={aoEnviar} noValidate>
            <div>
              <div className="eyebrow">{obrigatoria ? "Primeiro acesso" : "Minha conta"}</div>
              <h1 className={celular ? "h1" : undefined} style={celular ? { marginTop: 6 } : undefined}>
                {obrigatoria ? "Defina sua senha" : "Alterar senha"}
              </h1>
              <p className="sub">
                {obrigatoria ? "Você entrou com uma senha provisória. Escolha uma senha só sua para continuar." : "Informe a senha atual e escolha a nova."} Mínimo de {MINIMO} caracteres.
              </p>
            </div>
            {campo("senhaAtual", obrigatoria ? "Senha provisória" : "Senha atual", atual, setAtual, "current-password")}
            {campo("novaSenha", "Nova senha", nova, setNova, "new-password")}
            {campo("confirmacao", "Confirme a nova senha", confirmacao, setConfirmacao, "new-password")}
            {erro && (
              <div role="alert" className="erro">
                {erro.texto}
              </div>
            )}
            <button type="submit" className={celular ? "btn" : "entrar"} disabled={enviando}>
              {enviando ? "Salvando…" : "Salvar senha"}
            </button>
            {obrigatoria ? (
              <button
                type="button"
                className={celular ? "btn2" : "voltar"}
                onClick={async () => {
                  await api("/api/auth/logout", { metodo: "POST" }).catch(() => null);
                  recarregarEm("/login");
                }}
              >
                Sair
              </button>
            ) : (
              <Link className={celular ? "btn2" : "voltar"} href={destino}>
                Cancelar
              </Link>
            )}
          </form>
        )
      }
    </MolduraDeAcesso>
  );
}
