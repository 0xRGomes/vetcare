"use client";

// Casca das telas internas: menu lateral no desktop; barra superior e abas no celular.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { api, recarregarEm } from "./api";
import { CAMINHOS, Cruz, Traco } from "./icones";
import { iniciais } from "./status";
import type { Permissoes, Sessao } from "./tipos";
import { useEhCelular } from "./useEhCelular";

const ROTULO_PERFIL = { ADMINISTRADOR: "Administrador", RECEPCIONISTA: "Recepcionista", VETERINARIO: "Veterinário" } as const;

interface Contexto {
  sessao: Sessao;
  permissoes: Permissoes;
  celular: boolean;
}

const ContextoDaCasca = createContext<Contexto | null>(null);

export function useCasca(): Contexto {
  const ctx = useContext(ContextoDaCasca);
  if (!ctx) throw new Error("useCasca fora da Casca");
  return ctx;
}

type Chave = "inicio" | "agenda" | "novo" | "tutores" | "usuarios";

const ITENS: Record<Chave, { rotulo: string; curto: string; href: string; icone: string }> = {
  inicio: { rotulo: "Início", curto: "Início", href: "/inicio", icone: CAMINHOS.inicio },
  agenda: { rotulo: "Agenda", curto: "Agenda", href: "/agenda", icone: CAMINHOS.agenda },
  novo: { rotulo: "Novo agendamento", curto: "Agendar", href: "/agenda/novo", icone: CAMINHOS.novo },
  tutores: { rotulo: "Tutores e animais", curto: "Tutores", href: "/tutores", icone: CAMINHOS.tutores },
  usuarios: { rotulo: "Usuários e perfis", curto: "Usuários", href: "/usuarios", icone: CAMINHOS.usuarios },
};

function itensDoMenu(p: Permissoes): Chave[] {
  const chaves: Chave[] = [];
  if (p.inicio) chaves.push("inicio");
  chaves.push("agenda");
  if (p.agendar) chaves.push("novo");
  chaves.push("tutores");
  if (p.usuarios) chaves.push("usuarios");
  return chaves;
}

function ativa(caminho: string): Chave {
  if (caminho.startsWith("/agenda/novo")) return "novo";
  if (caminho.startsWith("/agenda")) return "agenda";
  if (caminho.startsWith("/tutores")) return "tutores";
  if (caminho.startsWith("/usuarios")) return "usuarios";
  return "inicio";
}

async function sair() {
  await api("/api/auth/logout", { metodo: "POST" }).catch(() => null);
  recarregarEm("/login");
}

export function Casca({ sessao, permissoes, children }: { sessao: Sessao; permissoes: Permissoes; children: ReactNode }) {
  const celular = useEhCelular();
  const caminho = usePathname();
  if (celular === null) return null;

  const atual = ativa(caminho);
  const chaves = itensDoMenu(permissoes);
  const perfil = ROTULO_PERFIL[sessao.perfil];

  return (
    <ContextoDaCasca.Provider value={{ sessao, permissoes, celular }}>
      {celular ? (
        <div className="m">
          <div className="m-app">
            {children}
            <AbasDoCelular chaves={chaves} atual={atual} sessao={sessao} perfil={perfil} />
          </div>
        </div>
      ) : (
        <div className="d">
          <div className="d-side">
            <nav className="d-nav" aria-label="Menu principal">
              <Link href={permissoes.inicio ? "/inicio" : "/agenda"} className="d-brand">
                <i>
                  <Cruz />
                </i>
                <span>VETCARE</span>
              </Link>
              <div className="d-role">
                <span>Perfil ativo</span>
                <span>{perfil}</span>
              </div>
              <ul className="d-menu">
                {chaves.map((k) => (
                  <li key={k}>
                    <Link href={ITENS[k].href} aria-current={k === atual ? "page" : undefined}>
                      <Traco d={ITENS[k].icone} />
                      <span>{ITENS[k].rotulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="d-user">
                <span className="av">{iniciais(sessao.nome)}</span>
                <div>
                  <b>{sessao.nome}</b>
                  <small>{perfil}</small>
                </div>
                <Link href="/senha" aria-label="Alterar senha" title="Alterar senha">
                  <Traco d={CAMINHOS.chave} />
                </Link>
                <button type="button" aria-label="Sair" title="Sair" onClick={sair}>
                  <Traco d={CAMINHOS.sair} />
                </button>
              </div>
            </nav>
          </div>
          <main className="d-main">
            <div className="strip8" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="d-cont">{children}</div>
          </main>
        </div>
      )}
    </ContextoDaCasca.Provider>
  );
}

function AbasDoCelular({ chaves, atual, sessao, perfil }: { chaves: Chave[]; atual: Chave; sessao: Sessao; perfil: string }) {
  const [aberto, setAberto] = useState(false);
  // Como no protótipo: o que não cabe na barra fica no painel "Mais", junto com "Sair".
  const noPainel: Chave[] = ["novo", "usuarios"];
  const abas = chaves.filter((k) => !noPainel.includes(k));
  const mais = chaves.filter((k) => noPainel.includes(k));
  const emMais = mais.includes(atual);

  return (
    <>
      <nav className="tabbar" aria-label="Menu principal">
        {abas.map((k) => (
          <Link key={k} className="tab" href={ITENS[k].href} aria-current={k === atual ? "page" : undefined}>
            <span className="ic">
              <Traco d={ITENS[k].icone} size={22} />
            </span>
            {ITENS[k].curto}
          </Link>
        ))}
        <button type="button" className="tab" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-current={emMais || aberto ? "page" : undefined}>
          <span className="ic">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </span>
          Mais
        </button>
      </nav>
      {aberto && (
        <>
          <div className="scrim" onClick={() => setAberto(false)} />
          <section className="sheet" role="dialog" aria-label="Mais opções">
            <div className="grab" />
            <div className="row" style={{ padding: "4px 0 8px" }}>
              <span className="av" style={{ background: "#A3CF8F", color: "#0B2A66" }}>
                {iniciais(sessao.nome)}
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ display: "block" }}>{sessao.nome}</b>
                <span className="small muted">Perfil: {perfil}</span>
              </div>
            </div>
            <ul className="list">
              {mais.map((k) => (
                <li key={k}>
                  <Link className="lrow" href={ITENS[k].href} aria-current={k === atual ? "page" : undefined} onClick={() => setAberto(false)} style={{ color: "#1E2B4A", textDecoration: "none" }}>
                    <span className="pawbox" style={{ width: 40, height: 40, background: "#E6EBFF", color: "#0B3A8F" }}>
                      <Traco d={ITENS[k].icone} />
                    </span>
                    <b style={{ flex: 1, textAlign: "left" }}>{ITENS[k].rotulo}</b>
                  </Link>
                </li>
              ))}
              <li>
                <Link className="lrow" href="/senha" style={{ color: "#1E2B4A", textDecoration: "none" }}>
                  <span className="pawbox" style={{ width: 40, height: 40, background: "#E6EBFF", color: "#0B3A8F" }}>
                    <Traco d={CAMINHOS.chave} />
                  </span>
                  <b style={{ flex: 1, textAlign: "left" }}>Alterar senha</b>
                </Link>
              </li>
              <li>
                <button type="button" className="lrow" onClick={sair} style={{ color: "#9B1C1C" }}>
                  <span className="pawbox" style={{ width: 40, height: 40, background: "#FDECEC", color: "#9B1C1C" }}>
                    <Traco d={CAMINHOS.sair} />
                  </span>
                  <b style={{ flex: 1, textAlign: "left" }}>Sair</b>
                </button>
              </li>
            </ul>
          </section>
        </>
      )}
    </>
  );
}

/** Barra superior do layout celular. */
export function TopoCelular({ titulo, esquerda, direita }: { titulo: string; esquerda?: ReactNode; direita?: ReactNode }) {
  return (
    <div className="top">
      <div className="strip">
        <i />
        <i />
        <i />
        <i />
      </div>
      <header className="bar">
        {esquerda ?? (
          <span className="mark">
            <Cruz size={20} />
          </span>
        )}
        <h1>{titulo}</h1>
        {direita}
      </header>
    </div>
  );
}
