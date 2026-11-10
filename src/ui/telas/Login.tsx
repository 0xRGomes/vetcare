"use client";

// REQ 02 — Autenticar usuário

import { useState, type FormEvent } from "react";
import { api, mensagemDe, recarregarEm } from "../api";
import { Cadeado } from "../icones";
import { MolduraDeAcesso } from "../MolduraDeAcesso";
import type { Permissoes, Sessao } from "../tipos";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const { sessao, permissoes } = await api<{ sessao: Sessao; permissoes: Permissoes }>("/api/auth/login", { metodo: "POST", corpo: { email, senha } });
      // Senha provisória: antes de qualquer tela, o usuário define a própria senha.
      recarregarEm(sessao.trocarSenha ? "/senha" : permissoes.inicio ? "/inicio" : "/agenda");
    } catch (e) {
      setErro(mensagemDe(e));
      setEnviando(false);
    }
  }

  return (
    <MolduraDeAcesso>
      {(celular) => {
        const expirada = new URLSearchParams(window.location.search).has("expirada");
        const https = window.location.protocol === "https:";
        const aviso = erro || (expirada ? "Sua sessão expirou. Faça login novamente." : "");
        return (
          <form className={celular ? "stack" : "lg-form"} aria-label="Entrar no VetCare" onSubmit={aoEnviar} noValidate>
            <div>
              <div className="eyebrow">REQ 02 · Autenticar usuário</div>
              <h1 className={celular ? "h1" : undefined} style={celular ? { marginTop: 6 } : undefined}>
                Entrar
              </h1>
              <p className="sub">Use as credenciais fornecidas pelo administrador da clínica.</p>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="email">
                E-mail
              </label>
              <input className="inp" id="email" type="email" inputMode="email" autoComplete="username" placeholder="nome@clinica.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="senha">
                Senha
              </label>
              <input className="inp" id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            {aviso && (
              <div role="alert" className="erro">
                {aviso}
              </div>
            )}
            <button type="submit" className={celular ? "btn" : "entrar"} disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
            <div className="note">
              <Cadeado />
              <span>
                {https ? "Conexão protegida por HTTPS. " : ""}Seu acesso é definido pelo perfil: Administrador, Recepcionista ou Veterinário. Esqueceu a senha? Peça ao administrador uma nova senha
                provisória.
              </span>
            </div>
          </form>
        );
      }}
    </MolduraDeAcesso>
  );
}
