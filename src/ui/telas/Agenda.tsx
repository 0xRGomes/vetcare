"use client";

// REQ 09 — Consultar agenda (por dia, por semana e por profissional)

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { dataBR, dataCurta, dataMedia, dataValida, dataPorExtenso, diaCurto, diaDaSemana, diaDoMes, hojeLocal, horaDeMinutos, inicioDaSemana, minutos, somarDias } from "@/lib/datas";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Traco } from "../icones";
import { corDoStatus } from "../status";
import type { Agenda as DadosDaAgenda, Consulta, Profissional } from "../tipos";
import { useDados } from "../useDados";

type Visao = "dia" | "semana" | "prof";

const PASSO = 30;

/** Linhas da grade do dia: do início da primeira jornada ao fim da última. */
function horasDoDia(profissionais: Profissional[], consultas: Consulta[], data: string): string[] {
  const emEscala = profissionais.filter((p) => p.dias.includes(diaDaSemana(data)));
  const inicios = [...emEscala.map((p) => minutos(p.horaInicio)), ...consultas.map((c) => minutos(c.hora))];
  const fins = [...emEscala.map((p) => minutos(p.horaFim)), ...consultas.map((c) => minutos(c.hora) + PASSO)];
  if (inicios.length === 0) return [];
  const horas: string[] = [];
  for (let m = Math.min(...inicios); m < Math.max(...fins); m += PASSO) horas.push(horaDeMinutos(m));
  return horas;
}

const atende = (p: Profissional, data: string, hora: string) =>
  p.dias.includes(diaDaSemana(data)) && minutos(hora) >= minutos(p.horaInicio) && minutos(hora) + PASSO <= minutos(p.horaFim);

export function Agenda() {
  const { celular, permissoes } = useCasca();
  const q = useSearchParams();
  const [visao, setVisao] = useState<Visao>(() => (q.get("visao") === "semana" ? "semana" : "dia"));
  const [data, setData] = useState(() => (dataValida(q.get("data")) ? q.get("data")! : hojeLocal()));
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [profSelecionado, setProfSelecionado] = useState<number | null>(null);
  const [folha, setFolha] = useState(false);

  const segunda = inicioDaSemana(data);
  const { dados, erro, atualizadoAs } = useDados<DadosDaAgenda>(`/api/agenda?de=${segunda}&ate=${somarDias(segunda, 6)}`, 30_000);

  const hoje = dados?.hoje ?? hojeLocal();
  const profissionais = useMemo(() => dados?.profissionais ?? [], [dados]);
  const todas = useMemo(() => dados?.consultas ?? [], [dados]);
  const ativas = useMemo(() => todas.filter((c) => c.status !== "Cancelada"), [todas]);
  const doDia = useMemo(() => ativas.filter((c) => c.data === data), [ativas, data]);
  const horas = useMemo(() => horasDoDia(profissionais, doDia, data), [profissionais, doDia, data]);
  const diasDaSemana = [0, 1, 2, 3, 4, 5].map((n) => somarDias(segunda, n));
  const prof = profissionais.find((p) => p.id === profSelecionado) ?? profissionais[0];
  const doProf = todas.filter((c) => c.data === data && c.profissionalId === prof?.id);
  const detalhe = todas.find((c) => c.id === selecionada) ?? null;

  const visoes: [Visao, string][] = permissoes.agendaPropria
    ? [["dia", "Dia"], ["semana", "Semana"]]
    : [["dia", "Dia"], ["semana", "Semana"], ["prof", "Por profissional"]];
  const passo = visao === "semana" ? 7 : 1;
  const irPara = (nova: string) => {
    setData(nova);
    setSelecionada(null);
  };
  const futuro = (dia: string, hora: string) => dia > hoje || (dia === hoje && hora > (dados?.horaAtual ?? "00:00"));
  const titulo = permissoes.agendaPropria ? "Minha agenda" : "Agenda";
  const semConsultas = <p className={celular ? "vazio" : "d-vazio"}>Nenhuma consulta {visao === "prof" && prof ? `de ${prof.nome} ` : ""}neste dia.</p>;

  const corpoDoDetalhe = detalhe && (
    <>
      <span className="pill" style={{ alignSelf: "flex-start", ...corDoStatus(detalhe.status) }}>
        {detalhe.status}
      </span>
      <dl className="dl">
        {!celular && (
          <>
            <dt>Horário</dt>
            <dd>
              {detalhe.hora} · {dataCurta(detalhe.data)}
            </dd>
          </>
        )}
        <dt>Tutor</dt>
        <dd>{detalhe.tutor.nome}</dd>
        <dt>Animal</dt>
        <dd>{[detalhe.animal.especie, detalhe.animal.raca].filter(Boolean).join(" · ")}</dd>
        <dt>Veterinário</dt>
        <dd>{detalhe.profissional.nome}</dd>
        <dt>Motivo</dt>
        <dd>{detalhe.motivo}</dd>
      </dl>
      <Link className={celular ? "btn2" : "d-btn2"} href={`/tutores?tutor=${detalhe.tutor.id}`}>
        Ver ficha do tutor
      </Link>
    </>
  );

  if (celular) {
    return (
      <>
        <TopoCelular
          titulo={titulo}
          direita={
            permissoes.agendar && (
              <Link className="iconbtn" href={`/agenda/novo?data=${data}`} aria-label="Novo agendamento">
                <Traco d={CAMINHOS.mais} size={24} largura={2.4} />
              </Link>
            )
          }
        />
        <main className="page">
          <div>
            <div className="eyebrow">REQ 09 · Consultar agenda</div>
            <h2 className="h1" style={{ marginTop: 4 }}>
              {dataMedia(data)}
            </h2>
            <span className="mono small muted">{atualizadoAs ? `Atualizado às ${atualizadoAs}` : "Carregando…"}</span>
          </div>
          <div className="chips" aria-label="Dias">
            <button type="button" className="day" style={{ flexBasis: 40 }} aria-label="Semana anterior" onClick={() => irPara(somarDias(data, -7))}>
              ‹
            </button>
            {diasDaSemana.map((d) => (
              <button key={d} type="button" className={d === data ? "day on" : "day"} aria-pressed={d === data} onClick={() => irPara(d)}>
                {diaCurto(d)}
                <b>{diaDoMes(d)}</b>
              </button>
            ))}
            <button type="button" className="day" style={{ flexBasis: 40 }} aria-label="Próxima semana" onClick={() => irPara(somarDias(data, 7))}>
              ›
            </button>
          </div>
          <div className="seg" role="group" aria-label="Visualização">
            {visoes.map(([v, rotulo]) => (
              <button key={v} type="button" aria-pressed={visao === v} onClick={() => setVisao(v)}>
                {rotulo}
              </button>
            ))}
          </div>
          {erro && (
            <div role="alert" className="erro">
              {erro}
            </div>
          )}

          {visao === "dia" && (
            <>
              {doDia.length === 0 ? (
                dados && semConsultas
              ) : (
                <ul className="list" style={{ gap: 10 }}>
                  {doDia.map((c) => {
                    const cor = corDoStatus(c.status);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="appt"
                          onClick={() => {
                            setSelecionada(c.id);
                            setFolha(true);
                          }}
                          style={{ background: cor.background, border: c.id === selecionada ? "2px solid #0B3A8F" : "1px solid #DCE3EF" }}
                        >
                          <span className="mono" style={{ color: "#0B3A8F", fontSize: 15, width: 48 }}>
                            {c.hora}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, textAlign: "left", color: cor.color }}>
                            <b style={{ display: "block", fontSize: 16 }}>{c.animal.nome}</b>
                            <span className="small">
                              {c.tutor.nome} · {c.profissional.nome}
                            </span>
                          </span>
                          <span className="small" style={{ fontWeight: 700, color: cor.color }}>
                            {c.status}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {permissoes.agendar && data >= hoje && (
                <Link className="btn2" href={`/agenda/novo?data=${data}`}>
                  Ver horários livres e agendar
                </Link>
              )}
            </>
          )}

          {visao === "semana" && (
            <div className="stack" style={{ gap: 12 }}>
              {diasDaSemana.map((d) => {
                const itens = ativas.filter((c) => c.data === d);
                const destaque = d === hoje;
                return (
                  <section key={d} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", background: destaque ? "#0B3A8F" : "#E6EBF5", color: destaque ? "#FFFFFF" : "#0B3A8F" }}>
                      <b>
                        {diaCurto(d)} {dataCurta(d)}
                      </b>
                      <span className="small">{itens.length === 1 ? "1 consulta" : `${itens.length} consultas`}</span>
                    </div>
                    {itens.map((c) => (
                      <div key={c.id} className="row" style={{ padding: "10px 16px", borderTop: "1px solid #DCE3EF" }}>
                        <span className="mono" style={{ color: "#0B3A8F", width: 48 }}>
                          {c.hora}
                        </span>
                        <b style={{ flex: 1 }}>{c.animal.nome}</b>
                        <span className="small muted">{c.profissional.nome}</span>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          )}

          {visao === "prof" && (
            <>
              <div className="chips">
                {profissionais.map((p) => (
                  <button key={p.id} type="button" className="chip" aria-pressed={p.id === prof?.id} onClick={() => setProfSelecionado(p.id)}>
                    {p.nome}
                  </button>
                ))}
              </div>
              {doProf.length === 0 ? (
                dados && semConsultas
              ) : (
                <section className="card">
                  <ul className="list">
                    {doProf.map((c) => (
                      <li key={c.id} className="li">
                        <span className="mono" style={{ color: "#0B3A8F", width: 48 }}>
                          {c.hora}
                        </span>
                        <span style={{ flex: 1 }}>
                          <b>{c.animal.nome}</b>
                          <span className="small muted" style={{ display: "block" }}>
                            {c.tutor.nome}
                          </span>
                        </span>
                        <span className="pill" style={corDoStatus(c.status)}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </main>

        {folha && detalhe && (
          <>
            <div className="scrim" onClick={() => setFolha(false)} />
            <section className="sheet" role="dialog" aria-label="Detalhes da consulta">
              <div className="grab" />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="eyebrow">
                    Consulta · {detalhe.hora} · {dataCurta(detalhe.data)}
                  </div>
                  <h2 className="h1" style={{ marginTop: 4 }}>
                    {detalhe.animal.nome}
                  </h2>
                </div>
                <button type="button" className="iconbtn" aria-label="Fechar" onClick={() => setFolha(false)}>
                  <Traco d={CAMINHOS.fechar} size={22} largura={2.2} />
                </button>
              </div>
              {corpoDoDetalhe}
            </section>
          </>
        )}
      </>
    );
  }

  const colunas = `72px repeat(${Math.max(profissionais.length, 1)}, minmax(0, 1fr))`;

  return (
    <>
      <header className="d-head">
        <div>
          <div className="eyebrow">REQ 09 · Consultar agenda</div>
          <h1>{titulo}</h1>
          <p className="sub">{visao === "semana" ? `Semana de ${dataCurta(segunda)} a ${dataBR(somarDias(segunda, 5))}` : dataPorExtenso(data)}</p>
        </div>
        {permissoes.agendar && (
          <Link href={`/agenda/novo?data=${data}`} className="d-btn">
            + Novo agendamento
          </Link>
        )}
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div role="group" aria-label="Visualização da agenda" className="d-seg">
          {visoes.map(([v, rotulo]) => (
            <button key={v} type="button" aria-pressed={visao === v} onClick={() => setVisao(v)}>
              {rotulo}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="d-sq" aria-label={visao === "semana" ? "Semana anterior" : "Dia anterior"} onClick={() => irPara(somarDias(data, -passo))}>
            ‹
          </button>
          <button type="button" className="d-btn2" style={{ padding: "0 16px" }} onClick={() => irPara(hoje)}>
            Hoje
          </button>
          <button type="button" className="d-sq" aria-label={visao === "semana" ? "Próxima semana" : "Próximo dia"} onClick={() => irPara(somarDias(data, passo))}>
            ›
          </button>
          <input type="date" className="inp" aria-label="Ir para a data" style={{ width: 160 }} value={data} onChange={(e) => e.target.value && irPara(e.target.value)} />
          <span className="mono muted" style={{ fontSize: 12, marginLeft: 8 }}>
            {atualizadoAs ? `Atualizado às ${atualizadoAs}` : "Carregando…"}
          </span>
        </div>
      </div>

      {erro && (
        <div role="alert" className="danger">
          {erro}
        </div>
      )}

      <div className="d-cols" style={{ marginTop: -4 }}>
        <section aria-label="Grade da agenda" className="d-card" style={{ flex: "999 1 560px", minWidth: 0, padding: 0, overflow: "hidden" }}>
          {visao === "dia" &&
            (horas.length === 0 ? (
              dados && <p className="d-vazio">Nenhum veterinário atende neste dia.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: profissionais.length > 1 ? 640 : 0 }}>
                  <div className="d-grid-head" style={{ gridTemplateColumns: colunas }}>
                    <div>Hora</div>
                    {profissionais.map((p) => (
                      <div key={p.id}>{p.nome}</div>
                    ))}
                  </div>
                  {horas.map((hora) => (
                    <div key={hora} className="d-grid-row" style={{ gridTemplateColumns: colunas }}>
                      <div className="hora">{hora}</div>
                      {profissionais.map((p) => {
                        const c = doDia.find((x) => x.hora === hora && x.profissionalId === p.id);
                        return (
                          <div key={p.id} className="cel">
                            {c ? (
                              <button type="button" className="d-cons" aria-pressed={c.id === selecionada} onClick={() => setSelecionada(c.id)} style={corDoStatus(c.status)}>
                                <b>{c.animal.nome}</b>
                                <span>
                                  {c.tutor.nome} · {c.status}
                                </span>
                              </button>
                            ) : !atende(p, data, hora) ? (
                              <span className="d-fora" aria-label="Fora do horário de atendimento">
                                —
                              </span>
                            ) : permissoes.agendar && futuro(data, hora) ? (
                              <Link className="d-livre" href={`/agenda/novo?profissional=${p.id}&data=${data}&hora=${hora}`}>
                                Livre
                              </Link>
                            ) : (
                              <span className="d-livre">Livre</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {visao === "semana" && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(150px, 1fr))", minWidth: 900 }}>
                {diasDaSemana.map((d, i) => {
                  const itens = ativas.filter((c) => c.data === d);
                  const destaque = d === hoje;
                  return (
                    <div key={d} style={{ borderLeft: i ? "1px solid #DCE3EF" : 0, display: "flex", flexDirection: "column" }}>
                      <button
                        type="button"
                        title="Abrir este dia"
                        onClick={() => {
                          irPara(d);
                          setVisao("dia");
                        }}
                        style={{ padding: "14px 12px", background: destaque ? "#0B3A8F" : "#E6EBF5", color: destaque ? "#FFFFFF" : "#0B3A8F", border: 0, textAlign: "left", cursor: "pointer", font: "16px 'Barlow', sans-serif" }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {diaCurto(d)} {dataCurta(d)}
                        </div>
                        <div style={{ fontSize: 13 }}>{itens.length === 1 ? "1 consulta" : `${itens.length} consultas`}</div>
                      </button>
                      {itens.map((c) => (
                        <div key={c.id} style={{ padding: "10px 12px", borderTop: "1px solid #DCE3EF", fontSize: 14 }}>
                          <span className="mono" style={{ color: "#0B3A8F" }}>
                            {c.hora}
                          </span>{" "}
                          <strong>{c.animal.nome}</strong>
                          <div style={{ fontSize: 13, color: "#5B6782" }}>{c.profissional.nome}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {visao === "prof" && (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="lbl">Profissional</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {profissionais.map((p) => (
                    <button key={p.id} type="button" className="d-chip" aria-pressed={p.id === prof?.id} onClick={() => setProfSelecionado(p.id)}>
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              {doProf.length === 0 ? (
                dados && semConsultas
              ) : (
                <ul className="d-list" style={{ margin: 0 }}>
                  {doProf.map((c) => (
                    <li key={c.id} style={{ flexWrap: "nowrap" }}>
                      <span className="h">{c.hora}</span>
                      <span style={{ flex: "1 1 auto" }}>
                        <strong>{c.animal.nome}</strong> · {c.tutor.nome}
                      </span>
                      <span className="pill" style={corDoStatus(c.status)}>
                        {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {visao === "dia" && (
          <aside aria-label="Detalhes da consulta" className="d-card d-narrow" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="eyebrow t">Consulta selecionada</div>
            {detalhe ? (
              <>
                <h2 className="h2" style={{ fontSize: 26 }}>
                  {detalhe.animal.nome}
                </h2>
                {corpoDoDetalhe}
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Clique em uma consulta da grade para ver os detalhes.{permissoes.agendar ? " Os horários marcados como “Livre” abrem um novo agendamento." : ""}
              </p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
