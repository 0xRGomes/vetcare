"use client";

// Painel do dia da recepção: resumo das consultas (REQ 09) e atalhos para os cadastros.

import Link from "next/link";
import { dataCurta, dataMedia, dataPorExtenso, diaCurto, nomeDoDia } from "@/lib/datas";
import { TopoCelular, useCasca } from "../Casca";
import { corDoStatus, iniciais } from "../status";
import type { Consulta, ResumoDoDia } from "../tipos";
import { useDados } from "../useDados";

function saudacao(): string {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const especieERaca = (c: Consulta) => [c.animal.especie, c.animal.raca].filter(Boolean).join(" · ");
const quando = (c: Consulta, hoje: string) => (c.data === hoje ? "" : `${diaCurto(c.data)} ${dataCurta(c.data)} · `);

export function Inicio() {
  const { sessao, celular } = useCasca();
  const { dados: r, erro } = useDados<ResumoDoDia>("/api/inicio", 60_000);
  const primeiroNome = sessao.nome.replace(/^(Dra?\.)\s*/, "").split(" ")[0];

  if (celular) {
    return (
      <>
        <TopoCelular
          titulo="Início"
          direita={
            <span className="av sm" style={{ background: "#A3CF8F", color: "#0B2A66" }} aria-label={sessao.nome}>
              {iniciais(sessao.nome)}
            </span>
          }
        />
        <main className="page">
          <div>
            <div className="eyebrow">{r ? dataMedia(r.hoje).replace(",", " ·") : " "}</div>
            <h2 className="h1" style={{ marginTop: 4 }}>
              {saudacao()}, {primeiroNome}
            </h2>
          </div>
          <div className="chips" aria-label="Ações rápidas">
            <Link className="chip on" href="/agenda/novo">
              + Agendar consulta
            </Link>
            <Link className="chip" href="/tutores?novo=1">
              Cadastrar tutor
            </Link>
            <Link className="chip" href="/agenda">
              Ver agenda
            </Link>
          </div>
          {erro && (
            <div role="alert" className="erro">
              {erro}
            </div>
          )}
          {r && (
            <>
              <section className="kpis" aria-label="Números do dia">
                <div className="kpi">
                  <span>Consultas hoje</span>
                  <b>{r.consultasHoje}</b>
                  <small>{plural(r.profissionaisEmEscala, "veterinário", "veterinários")}</small>
                </div>
                <div className="kpi">
                  <span>Na sala de espera</span>
                  <b>{r.naSalaDeEspera}</b>
                  <small>Check-in feito</small>
                </div>
                <div className="kpi">
                  <span>Tutores cadastrados</span>
                  <b>{r.tutores}</b>
                  <small>Cadastros ativos</small>
                </div>
                <div className="kpi" style={{ background: "#A3CF8F", borderColor: "#A3CF8F", color: "#0B2A66" }}>
                  <span style={{ color: "#0B2A66" }}>Animais cadastrados</span>
                  <b style={{ color: "#0B2A66" }}>{r.animais}</b>
                  <small style={{ color: "#0B2A66" }}>Vinculados a tutores</small>
                </div>
              </section>
              <section className="card" aria-label="Próximas consultas">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h2 className="h2">Próximas consultas</h2>
                  <Link href="/agenda" className="small">
                    Ver agenda
                  </Link>
                </div>
                {r.proximas.length === 0 ? (
                  <p className="vazio">Nenhuma consulta nos próximos dias.</p>
                ) : (
                  <ul className="list" style={{ marginTop: 8 }}>
                    {r.proximas.map((c) => (
                      <li key={c.id} className="li" style={{ flexWrap: "wrap" }}>
                        <span className="mono" style={{ color: "#0B3A8F", width: 44, fontSize: 15 }}>
                          {c.hora}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>
                            {c.animal.nome} <span style={{ fontWeight: 400, color: "#5B6782" }}>· {especieERaca(c)}</span>
                          </div>
                          <div className="small muted">
                            {quando(c, r.hoje)}
                            {c.tutor.nome} · {c.profissional.nome}
                          </div>
                        </div>
                        <span className="pill" style={corDoStatus(c.status)}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card navy" aria-label="Próximos dias">
                <h2 className="h2" style={{ color: "#FFFFFF" }}>
                  Consultas nos próximos dias
                </h2>
                {r.proximosDias.map((d) => (
                  <div key={d.data} className="vrow">
                    <span>
                      <b>{nomeDoDia(d.data)}</b> · {plural(d.total, "consulta", "consultas")}
                    </span>
                    <span className="mono">{dataCurta(d.data)}</span>
                  </div>
                ))}
                <Link className="btng" href="/agenda?visao=semana" style={{ marginTop: 12 }}>
                  Ver agenda da semana
                </Link>
              </section>
            </>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <header className="d-head">
        <div>
          <div className="eyebrow">{r ? dataPorExtenso(r.hoje).replace(",", " ·") : " "}</div>
          <h1>
            {saudacao()}, {primeiroNome}
          </h1>
          <p className="sub">Resumo do dia da recepção e próximas chegadas.</p>
        </div>
        <div className="d-actions">
          <Link href="/tutores?novo=1" className="d-btn2">
            Cadastrar tutor
          </Link>
          <Link href="/agenda/novo" className="d-btn">
            + Novo agendamento
          </Link>
        </div>
      </header>

      {erro && (
        <div role="alert" className="danger">
          {erro}
        </div>
      )}

      {r && (
        <>
          <section aria-label="Números do dia" className="d-kpis">
            <div className="d-kpi">
              <span>Consultas hoje</span>
              <b>{r.consultasHoje}</b>
              <small>{plural(r.profissionaisEmEscala, "veterinário", "veterinários")} em escala</small>
            </div>
            <div className="d-kpi">
              <span>Na sala de espera</span>
              <b>{r.naSalaDeEspera}</b>
              <small>Check-in realizado</small>
            </div>
            <div className="d-kpi">
              <span>Tutores cadastrados</span>
              <b>{r.tutores}</b>
              <small>Cadastros ativos na clínica</small>
            </div>
            <div className="d-kpi green">
              <span>Animais cadastrados</span>
              <b>{r.animais}</b>
              <small>Vinculados a tutores</small>
            </div>
          </section>

          <div className="d-cols">
            <section aria-label="Próximas consultas" className="d-card d-wide">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <h2 className="h2">Próximas consultas</h2>
                <Link href="/agenda" style={{ fontWeight: 600, fontSize: 15 }}>
                  Ver agenda completa
                </Link>
              </div>
              {r.proximas.length === 0 ? (
                <p className="d-vazio">Nenhuma consulta nos próximos dias.</p>
              ) : (
                <ul className="d-list">
                  {r.proximas.map((c) => (
                    <li key={c.id}>
                      <span className="h">{c.hora}</span>
                      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {c.animal.nome} <span style={{ fontWeight: 400, color: "#5B6782" }}>· {especieERaca(c)}</span>
                        </div>
                        <div style={{ fontSize: 14, color: "#5B6782" }}>
                          {quando(c, r.hoje)}Tutor: {c.tutor.nome} · {c.profissional.nome}
                        </div>
                      </div>
                      <span className="pill" style={corDoStatus(c.status)}>
                        {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="d-narrow" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section aria-label="Próximos dias" className="d-navy">
                <h2>Consultas nos próximos dias</h2>
                {r.proximosDias.map((d) => (
                  <div key={d.data} className="vrow">
                    <span>
                      <strong>{nomeDoDia(d.data)}</strong> · {plural(d.total, "consulta", "consultas")}
                    </span>
                    <span className="mono">{dataCurta(d.data)}</span>
                  </div>
                ))}
                <Link href="/agenda?visao=semana" className="d-btng">
                  Ver agenda da semana
                </Link>
              </section>
              <section aria-label="Escala de hoje" className="d-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 className="h2" style={{ fontSize: 20 }}>
                  Escala de hoje
                </h2>
                {r.escala.length === 0 && <span className="muted">Nenhum veterinário em escala hoje.</span>}
                {r.escala.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    <span className="muted">
                      {p.horaInicio.slice(0, 2)}h–{p.horaFim.slice(0, 2)}h · {plural(p.consultas, "consulta", "consultas")}
                    </span>
                  </div>
                ))}
              </section>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}
