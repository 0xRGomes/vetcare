"use client";

// REQ 09 — Consultar agenda (por dia, por semana e por profissional)

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dataBR, dataCurta, dataMedia, dataValida, dataPorExtenso, diaCurto, diaDaSemana, diaDoMes, hojeLocal, horaDeMinutos, inicioDaSemana, minutos, somarDias } from "@/lib/datas";
import { api, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Traco } from "../icones";
import { corDoStatus } from "../status";
import type { Agenda as DadosDaAgenda, Consulta, Profissional } from "../tipos";
import { useDados } from "../useDados";

type Visao = "dia" | "semana" | "prof";
type EscopoProfissional = "dia" | "futuras";

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
  // A data e a visão ficam no endereço (/agenda?data=2026-11-12&visao=semana):
  // dá para voltar pelo navegador, recarregar a página e compartilhar o link.
  const router = useRouter();
  const q = useSearchParams();
  const visaoPedida = q.get("visao");
  const visao: Visao = visaoPedida === "semana" ? "semana" : visaoPedida === "prof" && !permissoes.agendaPropria ? "prof" : "dia";
  const data = dataValida(q.get("data")) ? q.get("data")! : hojeLocal();
  const endereco = (d: string, v: Visao) => `/agenda?data=${d}${v === "dia" ? "" : `&visao=${v}`}`;
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [profSelecionado, setProfSelecionado] = useState<number | null>(null);
  const [escopoProfissional, setEscopoProfissional] = useState<EscopoProfissional>("dia");
  const [folha, setFolha] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");
  const dialogoCancelamento = useRef<HTMLDialogElement>(null);
  const setVisao = (v: Visao) => {
    setSelecionada(null);
    setFolha(false);
    router.push(endereco(data, v));
  };

  const segunda = inicioDaSemana(data);
  const { dados, erro, atualizadoAs, recarregar } = useDados<DadosDaAgenda>(`/api/agenda?de=${segunda}&ate=${somarDias(segunda, 6)}`, 30_000);

  useEffect(() => {
    const dialogo = dialogoCancelamento.current;
    if (!dialogo) return;
    if (confirmandoCancelamento && !dialogo.open) dialogo.showModal();
    else if (!confirmandoCancelamento && dialogo.open) dialogo.close();
  }, [confirmandoCancelamento]);

  const hoje = dados?.hoje ?? hojeLocal();
  const profissionais = dados?.profissionais ?? [];
  const todas = dados?.consultas ?? [];
  const ativas = todas.filter((c) => c.status !== "Cancelada");
  const doDia = ativas.filter((c) => c.data === data);
  const horas = horasDoDia(profissionais, doDia, data);
  const diasDaSemana = [0, 1, 2, 3, 4, 5].map((n) => somarDias(segunda, n));
  const prof = profissionais.find((p) => p.id === profSelecionado) ?? profissionais[0];
  const urlFuturasDoProf = visao === "prof" && escopoProfissional === "futuras" && prof
    ? `/api/agenda?todas=1&profissional=${prof.id}`
    : null;
  const {
    dados: agendaFuturaDoProf,
    erro: erroAgendaFuturaDoProf,
    carregando: carregandoAgendaFuturaDoProf,
    recarregar: recarregarAgendaFuturaDoProf,
  } = useDados<DadosDaAgenda>(urlFuturasDoProf, 30_000);
  const doProfDia = todas.filter((c) => c.data === data && c.profissionalId === prof?.id);
  const doProf = escopoProfissional === "futuras"
    ? agendaFuturaDoProf?.consultas.filter((c) => c.profissionalId === prof?.id) ?? []
    : doProfDia;
  const detalhe = todas.find((c) => c.id === selecionada)
    ?? (visao === "prof" && escopoProfissional === "futuras"
      ? agendaFuturaDoProf?.consultas.find((c) => c.id === selecionada) ?? null
      : null);

  const visoes: [Visao, string][] = permissoes.agendaPropria
    ? [["dia", "Dia"], ["semana", "Semana"]]
    : [["dia", "Dia"], ["semana", "Semana"], ["prof", "Por profissional"]];
  const passo = visao === "semana" ? 7 : 1;
  const irPara = (nova: string, v: Visao = visao) => {
    setSelecionada(null);
    setFolha(false);
    router.push(endereco(nova, v));
  };
  const mudarEscopoProfissional = (escopo: EscopoProfissional) => {
    setSelecionada(null);
    setFolha(false);
    setEscopoProfissional(escopo);
  };
  const selecionarProfissional = (id: number) => {
    setSelecionada(null);
    setFolha(false);
    setProfSelecionado(id);
  };
  const futuro = (dia: string, hora: string) => dia > hoje || (dia === hoje && hora > (dados?.horaAtual ?? "00:00"));
  const titulo = permissoes.agendaPropria ? "Minha agenda" : "Agenda";
  const semConsultas = <p className={celular ? "vazio" : "d-vazio"}>Nenhuma consulta {visao === "prof" && prof ? `de ${prof.nome} ` : ""}neste dia.</p>;
  const semConsultasFuturas = <p className={celular ? "vazio" : "d-vazio"}>Nenhuma consulta futura {prof ? `de ${prof.nome} ` : ""}encontrada.</p>;

  async function cancelarConsulta() {
    if (!detalhe) return;
    setCancelando(true);
    setErroCancelamento("");
    try {
      await api(`/api/consultas?id=${detalhe.id}`, { metodo: "DELETE" });
      setConfirmandoCancelamento(false);
      await Promise.all([recarregar(), recarregarAgendaFuturaDoProf()]);
    } catch (falha) {
      setErroCancelamento(mensagemDe(falha));
    } finally {
      setCancelando(false);
    }
  }

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
      {permissoes.agendar &&
        (detalhe.status === "Agendada" || detalhe.status === "Confirmada") &&
        futuro(detalhe.data, detalhe.hora) && (
          <button
            type="button"
            className={celular ? "btnd" : "d-btnd"}
            onClick={() => {
              setErroCancelamento("");
              setConfirmandoCancelamento(true);
            }}
          >
            Cancelar consulta
          </button>
        )}
    </>
  );

  const confirmacaoCancelamento = (
    <dialog
      ref={dialogoCancelamento}
      className="cancel-dialog"
      aria-labelledby="cancel-dialog-title"
      aria-describedby="cancel-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!cancelando) setConfirmandoCancelamento(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !cancelando) setConfirmandoCancelamento(false);
      }}
    >
      <div className="eyebrow">Atenção</div>
      <h2 id="cancel-dialog-title">Cancelar consulta?</h2>
      <p id="cancel-dialog-description">
        A consulta de <strong>{detalhe?.animal.nome}</strong> será marcada como cancelada. O histórico será mantido e o horário ficará disponível novamente.
      </p>
      {erroCancelamento && <p role="alert" className={celular ? "erro" : "danger"}>{erroCancelamento}</p>}
      <div className="cancel-dialog-actions">
        <button type="button" className={celular ? "btn2" : "d-btn2"} disabled={cancelando} onClick={() => setConfirmandoCancelamento(false)}>
          Manter consulta
        </button>
        <button type="button" className={celular ? "btnD" : "d-btnD"} disabled={cancelando} onClick={() => void cancelarConsulta()}>
          {cancelando ? "Cancelando…" : "Confirmar cancelamento"}
        </button>
      </div>
    </dialog>
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
              {visao === "prof" && escopoProfissional === "futuras" ? "Todas as consultas futuras" : dataMedia(data)}
            </h2>
            <span className="mono small muted">{atualizadoAs ? `Atualizado às ${atualizadoAs}` : "Carregando…"}</span>
          </div>
          {!(visao === "prof" && escopoProfissional === "futuras") && (
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
          )}
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
                      <button
                        key={c.id}
                        type="button"
                        className="row"
                        aria-pressed={c.id === selecionada}
                        onClick={() => {
                          setSelecionada(c.id);
                          setFolha(true);
                        }}
                        style={{ width: "100%", padding: "10px 16px", border: 0, borderTop: "1px solid #DCE3EF", background: c.id === selecionada ? "#EEF3FF" : "#FFFFFF", textAlign: "left", cursor: "pointer", font: "inherit" }}
                      >
                        <span className="mono" style={{ color: "#0B3A8F", width: 48 }}>
                          {c.hora}
                        </span>
                        <span style={{ flex: 1, textAlign: "left" }}>
                          <b style={{ display: "block" }}>{c.animal.nome}</b>
                          <span className="small muted">{c.tutor.nome} · {c.profissional.nome}</span>
                        </span>
                        <span className="small" style={{ fontWeight: 700, color: corDoStatus(c.status).color }}>{c.status}</span>
                      </button>
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
                  <button key={p.id} type="button" className="chip" aria-pressed={p.id === prof?.id} onClick={() => selecionarProfissional(p.id)}>
                    {p.nome}
                  </button>
                ))}
              </div>
              <div className="seg" role="group" aria-label="Período das consultas">
                <button type="button" aria-pressed={escopoProfissional === "dia"} onClick={() => mudarEscopoProfissional("dia")}>Dia selecionado</button>
                <button type="button" aria-pressed={escopoProfissional === "futuras"} onClick={() => mudarEscopoProfissional("futuras")}>Todas futuras</button>
              </div>
              {erroAgendaFuturaDoProf && <div role="alert" className="erro">{erroAgendaFuturaDoProf}</div>}
              {escopoProfissional === "futuras" && carregandoAgendaFuturaDoProf && !agendaFuturaDoProf && (
                <p className="vazio">Carregando consultas futuras…</p>
              )}
              {doProf.length === 0 ? (
                escopoProfissional === "futuras" ? agendaFuturaDoProf && semConsultasFuturas : dados && semConsultas
              ) : (
                <section className="card">
                  <ul className="list">
                    {doProf.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="appt"
                          aria-pressed={c.id === selecionada}
                          onClick={() => {
                            setSelecionada(c.id);
                            setFolha(true);
                          }}
                          style={{ background: corDoStatus(c.status).background, border: c.id === selecionada ? "2px solid #0B3A8F" : "1px solid #DCE3EF" }}
                        >
                          <span className="mono" style={{ color: "#0B3A8F", fontSize: 15, width: 48 }}>
                            {c.hora}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, textAlign: "left", color: corDoStatus(c.status).color }}>
                            <b style={{ display: "block", fontSize: 16 }}>{c.animal.nome}</b>
                            <span className="small">{escopoProfissional === "futuras" ? `${dataCurta(c.data)} · ` : ""}{c.tutor.nome}</span>
                          </span>
                          <span className="small" style={{ fontWeight: 700, color: corDoStatus(c.status).color }}>{c.status}</span>
                        </button>
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
        {confirmacaoCancelamento}
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
          <p className="sub">
            {visao === "semana"
              ? `Semana de ${dataCurta(segunda)} a ${dataBR(somarDias(segunda, 5))}`
              : visao === "prof" && escopoProfissional === "futuras"
                ? `Todas as consultas futuras${prof ? ` de ${prof.nome}` : ""}`
                : dataPorExtenso(data)}
          </p>
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
          {!(visao === "prof" && escopoProfissional === "futuras") && (
            <>
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
            </>
          )}
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
                        onClick={() => irPara(d, "dia")}
                        style={{ padding: "14px 12px", background: destaque ? "#0B3A8F" : "#E6EBF5", color: destaque ? "#FFFFFF" : "#0B3A8F", border: 0, textAlign: "left", cursor: "pointer", font: "16px 'Barlow', sans-serif" }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {diaCurto(d)} {dataCurta(d)}
                        </div>
                        <div style={{ fontSize: 13 }}>{itens.length === 1 ? "1 consulta" : `${itens.length} consultas`}</div>
                      </button>
                      {itens.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="d-cons"
                          aria-pressed={c.id === selecionada}
                          onClick={() => setSelecionada(c.id)}
                          style={{ display: "block", minHeight: 0, padding: "10px 12px", border: 0, borderTop: "1px solid #DCE3EF", borderRadius: 0, ...corDoStatus(c.status), fontSize: 14 }}
                        >
                          <span className="mono" style={{ color: "#0B3A8F" }}>
                            {c.hora}
                          </span>{" "}
                          <strong>{c.animal.nome}</strong>
                          <span style={{ fontSize: 13 }}>{c.tutor.nome} · {c.profissional.nome} · {c.status}</span>
                        </button>
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
                    <button key={p.id} type="button" className="d-chip" aria-pressed={p.id === prof?.id} onClick={() => selecionarProfissional(p.id)}>
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="lbl">Período</span>
                <div role="group" aria-label="Período das consultas" className="d-seg">
                  <button type="button" aria-pressed={escopoProfissional === "dia"} onClick={() => mudarEscopoProfissional("dia")}>Dia selecionado</button>
                  <button type="button" aria-pressed={escopoProfissional === "futuras"} onClick={() => mudarEscopoProfissional("futuras")}>Todas futuras</button>
                </div>
              </div>
              {erroAgendaFuturaDoProf && <div role="alert" className="danger">{erroAgendaFuturaDoProf}</div>}
              {escopoProfissional === "futuras" && carregandoAgendaFuturaDoProf && !agendaFuturaDoProf && (
                <p className="d-vazio">Carregando consultas futuras…</p>
              )}
              {doProf.length === 0 ? (
                escopoProfissional === "futuras" ? agendaFuturaDoProf && semConsultasFuturas : dados && semConsultas
              ) : (
                <ul className="d-list" style={{ margin: 0 }}>
                  {doProf.map((c) => (
                    <li key={c.id} style={{ padding: 0 }}>
                      <button
                        type="button"
                        className="d-cons"
                        aria-pressed={c.id === selecionada}
                        onClick={() => setSelecionada(c.id)}
                        style={{ display: "flex", alignItems: "center", gap: 16, minHeight: 50, padding: "10px 12px", ...corDoStatus(c.status) }}
                      >
                        <span className="h">{escopoProfissional === "futuras" ? `${dataCurta(c.data)} · ${c.hora}` : c.hora}</span>
                        <span style={{ flex: "1 1 auto" }}>
                          <strong>{c.animal.nome}</strong> · {c.tutor.nome}
                        </span>
                        <span className="pill" style={corDoStatus(c.status)}>
                          {c.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

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
              Clique em uma consulta da agenda para ver os detalhes.{permissoes.agendar ? " Os horários marcados como “Livre” abrem um novo agendamento." : ""}
            </p>
          )}
        </aside>
      </div>
      {confirmacaoCancelamento}
    </>
  );
}
