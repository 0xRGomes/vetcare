"use client";

// REQ 02 — Autenticar usuário

import { useState, type FormEvent } from "react";
import { api, mensagemDe, recarregarEm } from "../api";
import { Cadeado, Pata } from "../icones";
import type { Perfil, Permissoes } from "../tipos";
import { useEhCelular } from "../useEhCelular";

interface Demo {
  perfil: Perfil;
  email: string;
  senha: string;
}

const ROTULOS: Record<Perfil, string> = { RECEPCIONISTA: "Recepcionista", VETERINARIO: "Veterinário", ADMINISTRADOR: "Administrador" };

export function Login({ demo }: { demo: Demo[] }) {
  const celular = useEhCelular();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(credenciais: { email: string; senha: string }) {
    setErro("");
    setEnviando(true);
    try {
      const { permissoes } = await api<{ permissoes: Permissoes }>("/api/auth/login", { metodo: "POST", corpo: credenciais });
      recarregarEm(permissoes.inicio ? "/inicio" : "/agenda");
    } catch (e) {
      setErro(mensagemDe(e));
      setEnviando(false);
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    void entrar({ email, senha });
  }

  if (celular === null) return null;

  const expirada = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("expirada");
  const https = typeof window !== "undefined" && window.location.protocol === "https:";
  const aviso = erro || (expirada ? "Sua sessão expirou. Faça login novamente." : "");

  const campos = (classeCampo: string) => (
    <>
      <div className={classeCampo}>
        <label className="lbl" htmlFor="email">
          E-mail
        </label>
        <input className="inp" id="email" type="email" inputMode="email" autoComplete="username" placeholder="nome@clinica.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className={classeCampo}>
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
    </>
  );

  if (celular) {
    return (
      <div className="m">
        <div className="m-app">
          <div className="login">
            <div className="lhero">
              <i className="b1" />
              <i className="b2" />
              <i className="b3" />
              <i className="b4" />
              <Pata className="paw" color="#FFFFFF" />
              <div className="lbrand">
                <div className="eyebrow" style={{ color: "#FFFFFF" }}>
                  Gestão veterinária
                </div>
                <div className="logo">VETCARE</div>
              </div>
            </div>
            <div className="page" style={{ paddingBottom: 32, gap: 20 }}>
              <form className="stack" aria-label="Entrar no VetCare" onSubmit={aoEnviar} noValidate>
                <div>
                  <div className="eyebrow">REQ 02 · Autenticar usuário</div>
                  <h1 className="h1" style={{ marginTop: 6 }}>
                    Entrar
                  </h1>
                  <p className="sub">Use as credenciais fornecidas pelo administrador da clínica.</p>
                </div>
                {campos("field")}
                <button type="submit" className="btn" disabled={enviando}>
                  {enviando ? "Entrando…" : "Entrar"}
                </button>
                <div className="note">
                  <Cadeado />
                  <span>{https ? "Conexão protegida. " : ""}Seu acesso depende do perfil: Administrador, Recepcionista ou Veterinário.</span>
                </div>
              </form>
              {demo.length > 0 && (
                <div className="stack" style={{ gap: 10, paddingTop: 16, borderTop: "1px solid #DCE3EF" }}>
                  <div className="eyebrow" style={{ color: "#5B6782" }}>
                    Demonstração · entrar como
                  </div>
                  {demo.map((d) => (
                    <button key={d.perfil} type="button" className="btn2" disabled={enviando} onClick={() => entrar(d)}>
                      {ROTULOS[d.perfil]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg">
      <div className="lg-hero">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
        <Pata color="#FFFFFF" />
        <div className="lg-brand">
          <div className="tag">Sistema de gestão veterinária</div>
          <div className="logo">VETCARE</div>
          <div className="desc">Tutores, animais, agenda, prontuários e pagamentos em um só lugar.</div>
        </div>
      </div>
      <div className="lg-side">
        <div className="lg-box">
          <form className="lg-form" aria-label="Entrar no VetCare" onSubmit={aoEnviar} noValidate>
            <div>
              <div className="eyebrow">REQ 02 · Autenticar usuário</div>
              <h1>Entrar</h1>
              <p className="sub">Use as credenciais fornecidas pelo administrador da clínica.</p>
            </div>
            {campos("field")}
            <button type="submit" className="entrar" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
            <div className="note">
              <Cadeado />
              <span>{https ? "Conexão protegida por HTTPS. " : ""}Seu acesso é definido pelo perfil: Administrador, Recepcionista ou Veterinário.</span>
            </div>
          </form>
          {demo.length > 0 && (
            <div className="lg-demo">
              <div className="eyebrow">Demonstração · entrar como</div>
              <div>
                {demo.map((d) => (
                  <button key={d.perfil} type="button" disabled={enviando} onClick={() => entrar(d)}>
                    {ROTULOS[d.perfil]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
