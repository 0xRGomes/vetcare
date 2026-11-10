"use client";

// REQ 07 — Agendar consulta

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dataBR, dataCurta, dataValida, diaCurto, hojeLocal, idade, nomeDoDia } from "@/lib/datas";
import { api, ErroApi, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Traco } from "../icones";
import type { Animal, Consulta, Horario, Profissional, Tutor } from "../tipos";
import { useDados } from "../useDados";

const MOTIVOS = ["Consulta de rotina", "Retorno", "Vacinação", "Emergência"];

const descricaoDoAnimal = (a: Animal, hoje: string) => [a.especie, a.raca, idade(a.nascimento, hoje)].filter(Boolean).join(" · ");
const rotuloDoTutor = (t: Tutor) => `${t.nome} · CPF ${t.cpf}`;

function useAgendamento() {
  const q = useSearchParams();
  const hoje = hojeLocal();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [listaAberta, setListaAberta] = useState(false);
  const [animalId, setAnimalId] = useState<number | null>(null);
  const [profId, setProfId] = useState<number | null>(() => Number(q.get("profissional")) || null);
  const [data, setData] = useState(() => (dataValida(q.get("data")) && q.get("data")! >= hoje ? q.get("data")! : hoje));
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [hora, setHora] = useState<string | null>(() => q.get("hora"));
  const [conflito, setConflito] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [agendada, setAgendada] = useState<Consulta | null>(null);

  // Chegando da ficha do tutor (?tutor=ID&animal=ID), os dados já vêm preenchidos.
  useEffect(() => {
    const id = Number(q.get("tutor"));
    if (!id) return;
    api<{ tutor: Tutor }>(`/api/tutores/${id}`)
      .then(({ tutor: t }) => {
        setTutor(t);
        setBusca(rotuloDoTutor(t));
        const pedido = Number(q.get("animal"));
        setAnimalId(t.animais.find((a) => a.id === pedido)?.id ?? t.animais[0]?.id ?? null);
      })
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Espera o usuário parar de digitar antes de consultar o servidor.
  useEffect(() => {
    const t = window.setTimeout(() => setTermo(busca.trim()), 250);
    return () => window.clearTimeout(t);
  }, [busca]);

  const resultados = useDados<{ tutores: Tutor[] }>(listaAberta && !tutor ? `/api/tutores?busca=${encodeURIComponent(termo)}` : null);
  const profs = useDados<{ profissionais: Profissional[] }>("/api/profissionais");
  const profissionais = profs.dados?.profissionais ?? [];
  const prof = profissionais.find((p) => p.id === profId) ?? profissionais[0] ?? null;
  const grade = useDados<{ atende: boolean; horarios: Horario[] }>(prof && dataValida(data) ? `/api/agenda/horarios?profissional=${prof.id}&data=${data}` : null, 30_000);
  const animal = tutor?.animais.find((a) => a.id === animalId) ?? null;

  // Se o horário escolhido deixou de existir ou foi ocupado por outra pessoa, desfaz a escolha.
  const horarios = grade.dados?.horarios ?? [];
  const escolhido = hora ? horarios.find((h) => h.hora === hora) : undefined;
  const horaValida = hora && escolhido && !escolhido.ocupado && !escolhido.passado ? hora : null;

  /** Primeira pendência que impede a confirmação, ou "" se está tudo preenchido. */
  function pendencia(): string {
    if (!tutor) return "Selecione o tutor.";
    if (!animal) return tutor.animais.length ? "Selecione o animal." : "Este tutor ainda não tem animais cadastrados.";
    if (!prof) return "Selecione o veterinário.";
    if (!dataValida(data)) return "Informe a data.";
    if (!horaValida) return "Escolha um horário livre.";
    return "";
  }

  return {
    hoje,
    tutor,
    busca,
    listaAberta,
    sugestoes: (resultados.dados?.tutores ?? []).slice(0, 8),
    buscando: resultados.carregando,
    animal,
    prof,
    profissionais,
    data,
    motivo,
    hora: horaValida,
    horarios,
    atende: grade.dados?.atende ?? true,
    gradeCarregada: !!grade.dados,
    conflito,
    erro: erro || profs.erro || grade.erro,
    enviando,
    agendada,
    setMotivo,
    digitar(texto: string) {
      setBusca(texto);
      setTutor(null);
      setAnimalId(null);
      setListaAberta(true);
    },
    abrirLista: () => setListaAberta(true),
    fecharLista: () => window.setTimeout(() => setListaAberta(false), 150),
    escolherTutor(t: Tutor) {
      setTutor(t);
      setBusca(rotuloDoTutor(t));
      setAnimalId(t.animais[0]?.id ?? null);
      setListaAberta(false);
      setErro("");
    },
    escolherAnimal: (id: number) => setAnimalId(id),
    escolherProf(id: number) {
      setProfId(id);
      setHora(null);
      setConflito("");
    },
    escolherData(nova: string) {
      setData(nova);
      setHora(null);
      setConflito("");
    },
    escolherHora(h: Horario) {
      if (h.ocupado) {
        setConflito(`${prof?.nome} já tem consulta às ${h.hora}.`);
        return;
      }
      setHora(h.hora);
      setConflito("");
      setErro("");
    },
    async confirmar() {
      const falta = pendencia();
      if (falta) {
        setErro(falta);
        return;
      }
      setErro("");
      setEnviando(true);
      try {
        const { consulta } = await api<{ consulta: Consulta }>("/api/consultas", {
          metodo: "POST",
          corpo: { animalId: animal!.id, profissionalId: prof!.id, data, hora: horaValida, motivo },
        });
        setAgendada(consulta);
      } catch (e) {
        // 409: alguém ocupou o horário enquanto a tela estava aberta.
        if (e instanceof ErroApi && e.status === 409) {
          setConflito(e.message.replace(/^Horário indisponível\.\s*/, ""));
          setHora(null);
          void grade.recarregar();
        } else {
          setErro(mensagemDe(e));
        }
      } finally {
        setEnviando(false);
      }
    },
    outra() {
      setAgendada(null);
      setHora(null);
      void grade.recarregar();
    },
  };
}

type Estado = ReturnType<typeof useAgendamento>;

function CampoTutor({ a, classe }: { a: Estado; classe: string }) {
  return (
    <div className={`${classe} combo`}>
      <label className="lbl" htmlFor="tutor">
        Tutor
      </label>
      <input
        className="inp"
        id="tutor"
        role="combobox"
        aria-expanded={a.listaAberta && !a.tutor}
        aria-controls="tutor-lista"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Busque por nome, CPF, telefone ou animal"
        value={a.busca}
        onChange={(e) => a.digitar(e.target.value)}
        onFocus={a.abrirLista}
        onBlur={a.fecharLista}
      />
      {a.listaAberta && !a.tutor && (
        <ul id="tutor-lista" role="listbox">
          {a.sugestoes.map((t) => (
            <li key={t.id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => a.escolherTutor(t)}>
                <b>{t.nome}</b> · CPF {t.cpf}
                <span style={{ display: "block", fontSize: 13, color: "#5B6782" }}>{t.animais.length ? t.animais.map((x) => x.nome).join(", ") : "Sem animais cadastrados"}</span>
              </button>
            </li>
          ))}
          {a.sugestoes.length === 0 && (
            <li style={{ padding: "10px 12px", fontSize: 14, color: "#5B6782" }}>
              {a.buscando ? "Buscando…" : <>Nenhum tutor encontrado. <Link href="/tutores?novo=1">Cadastrar tutor</Link></>}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Animais({ a, classe, classeNova }: { a: Estado; classe: string; classeNova: string }) {
  if (!a.tutor) return <span className="muted" style={{ fontSize: 14 }}>Selecione o tutor para ver os animais dele.</span>;
  return (
    <>
      {a.tutor.animais.map((x) => (
        <button key={x.id} type="button" className={classe} aria-pressed={x.id === a.animal?.id} onClick={() => a.escolherAnimal(x.id)}>
          <b>{x.nome}</b>
          <span className="small muted">{descricaoDoAnimal(x, a.hoje)}</span>
        </button>
      ))}
      <Link className={classeNova} href={`/tutores?tutor=${a.tutor.id}&animal=novo`}>
        + Cadastrar animal
      </Link>
    </>
  );
}

function Veterinarios({ a, classe, estilo }: { a: Estado; classe: string; estilo?: React.CSSProperties }) {
  return (
    <>
      {a.profissionais.map((p) => (
        <button key={p.id} type="button" className={classe} style={estilo} aria-pressed={p.id === a.prof?.id} onClick={() => a.escolherProf(p.id)}>
          <b>{p.nome}</b>
          <span className="small muted">{p.especialidade}</span>
        </button>
      ))}
    </>
  );
}

function Horarios({ a }: { a: Estado }) {
  if (!a.gradeCarregada) return <span className="muted">Carregando horários…</span>;
  if (!a.atende || a.horarios.length === 0) {
    return (
      <div className="warn" role="status">
        <span>
          <b>{a.prof?.nome} não atende {nomeDoDia(a.data).toLowerCase()}.</b> Escolha outra data ou outro profissional.
        </span>
      </div>
    );
  }
  return (
    <>
      {a.horarios.map((h) => (
        <button
          key={h.hora}
          type="button"
          className={h.ocupado ? "busy" : h.passado ? "past" : undefined}
          aria-pressed={h.hora === a.hora}
          disabled={h.passado && !h.ocupado}
          title={h.ocupado ? "Horário ocupado" : h.passado ? "Horário já passou" : undefined}
          onClick={() => a.escolherHora(h)}
        >
          {h.hora}
        </button>
      ))}
    </>
  );
}

const quandoResumo = (a: Estado) => `${diaCurto(a.data)}, ${dataBR(a.data)} · ${a.hora ?? "escolha um horário"}`;

function textoDeSucesso(c: Consulta) {
  const dia = nomeDoDia(c.data).toLowerCase().replace("-feira", "");
  const artigo = dia === "sábado" || dia === "domingo" ? "no" : "na";
  return `${c.animal.nome} com ${c.profissional.nome} ${artigo} ${dia}, ${dataCurta(c.data)}, às ${c.hora}.`;
}

export function NovoAgendamento() {
  const { celular } = useCasca();
  const a = useAgendamento();
  const [passo, setPasso] = useState(1);

  const alertaDeConflito = a.conflito && (
    <div role="alert" className="warn">
      {!celular && <Traco d={CAMINHOS.alerta} size={20} largura={2} color="#7A3E00" />}
      <span>
        <b>Horário indisponível.</b> {a.conflito} Escolha outro horário{celular ? "" : " ou outro profissional"}.
      </span>
    </div>
  );

  if (celular) {
    const avancar = () => {
      if (passo === 1 && !a.animal) return;
      if (passo < 3) {
        setPasso(passo + 1);
        window.scrollTo(0, 0);
      } else void a.confirmar();
    };
    const cor = (n: number) => (passo >= n ? "#3651D9" : "#DCE3EF");
    return (
      <>
        <TopoCelular
          titulo="Novo agendamento"
          esquerda={
            <Link className="iconbtn" href="/agenda" aria-label="Voltar para a agenda">
              <Traco d={CAMINHOS.voltar} size={24} largura={2.2} />
            </Link>
          }
        />
        {a.agendada ? (
          <main className="page">
            <div className="okicon">
              <Traco d={CAMINHOS.certo} size={28} largura={2.6} color="#0B2A66" />
            </div>
            <h2 className="h1">Consulta agendada</h2>
            <p className="sub">{textoDeSucesso(a.agendada)}</p>
            <Link className="btn" href={`/agenda?data=${a.agendada.data}`}>
              Ver na agenda
            </Link>
            <Link className="btn2" href="/inicio">
              Voltar ao início
            </Link>
          </main>
        ) : (
          <>
            <main className="page withcta">
              <div>
                <div className="eyebrow">REQ 07 · Passo {passo} de 3</div>
                <div className="steps" aria-hidden="true">
                  <i style={{ background: cor(1) }} />
                  <i style={{ background: cor(2) }} />
                  <i style={{ background: cor(3) }} />
                </div>
              </div>
              {passo === 1 && (
                <>
                  <h2 className="h1">Tutor e animal</h2>
                  <CampoTutor a={a} classe="field" />
                  <span className="lbl">Animal</span>
                  <div className="stack" style={{ gap: 10 }}>
                    <Animais a={a} classe="opt" classeNova="opt dashed" />
                  </div>
                </>
              )}
              {passo === 2 && (
                <>
                  <h2 className="h1">Veterinário</h2>
                  <div className="stack" style={{ gap: 10 }}>
                    <Veterinarios a={a} classe="opt" />
                  </div>
                </>
              )}
              {passo === 3 && (
                <>
                  <h2 className="h1">Data e horário</h2>
                  <div className="field">
                    <label className="lbl" htmlFor="data">
                      Data
                    </label>
                    <input className="inp" id="data" type="date" min={a.hoje} value={a.data} onChange={(e) => a.escolherData(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="lbl" htmlFor="motivo">
                      Motivo
                    </label>
                    <select className="inp" id="motivo" value={a.motivo} onChange={(e) => a.setMotivo(e.target.value)}>
                      {MOTIVOS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <span className="lbl">Horários de {a.prof?.nome}</span>
                  <div className={a.atende && a.horarios.length ? "slots" : undefined}>
                    <Horarios a={a} />
                  </div>
                  <span className="small muted">Riscado = ocupado · contorno azul = selecionado</span>
                  {alertaDeConflito}
                  <section className="card navy" aria-label="Resumo">
                    <div className="eyebrow" style={{ color: "#C8D6FF" }}>
                      Resumo
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 17, marginTop: 6 }}>
                      {a.animal?.nome} · {a.tutor?.nome}
                    </div>
                    <div style={{ color: "#E3EAFF" }}>
                      {a.prof?.nome} · {diaCurto(a.data)}, {dataCurta(a.data)} · {a.hora ?? "escolha um horário"}
                    </div>
                  </section>
                </>
              )}
              {a.erro && (
                <div role="alert" className="erro">
                  {a.erro}
                </div>
              )}
            </main>
            <div className="ctabar">
              {passo > 1 && (
                <button type="button" className="btn2" style={{ flex: "0 0 112px" }} onClick={() => setPasso(passo - 1)}>
                  Voltar
                </button>
              )}
              <button type="button" className="btn" disabled={a.enviando || (passo === 1 && !a.animal)} onClick={avancar}>
                {passo < 3 ? "Continuar" : a.enviando ? "Agendando…" : "Confirmar agendamento"}
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <header>
        <Link href="/agenda" style={{ fontSize: 15, fontWeight: 600 }}>
          ‹ Voltar para a agenda
        </Link>
        <div className="eyebrow" style={{ marginTop: 12 }}>
          REQ 07 · Agendar consulta
        </div>
        <h1>Novo agendamento</h1>
      </header>

      <div className="d-cols">
        <form aria-label="Dados do agendamento" className="d-wide" style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={(e) => e.preventDefault()}>
          <section className="d-card d-sec">
            <h2>
              <span className="d-num">1</span>Tutor e animal
            </h2>
            <CampoTutor a={a} classe="field" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="lbl">Animal</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Animais a={a} classe="d-opt" classeNova="d-opt-dashed" />
              </div>
            </div>
          </section>

          <section className="d-card d-sec">
            <h2>
              <span className="d-num">2</span>Veterinário
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Veterinarios a={a} classe="d-opt" estilo={{ flex: "1 1 180px" }} />
            </div>
          </section>

          <section className="d-card d-sec">
            <h2>
              <span className="d-num">3</span>Data e horário
            </h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: "0 1 220px" }}>
                <label htmlFor="data">Data</label>
                <input className="inp" id="data" type="date" min={a.hoje} value={a.data} onChange={(e) => a.escolherData(e.target.value)} />
              </div>
              <div className="field" style={{ flex: "1 1 220px" }}>
                <label htmlFor="motivo">Motivo</label>
                <select className="inp" id="motivo" value={a.motivo} onChange={(e) => a.setMotivo(e.target.value)}>
                  {MOTIVOS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="lbl">Horários de {a.prof?.nome}</span>
              <div className={a.atende && a.horarios.length ? "d-slots" : undefined}>
                <Horarios a={a} />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#5B6782" }}>
                <span>Riscado = horário ocupado</span>
                <span>Contorno azul = selecionado</span>
              </div>
            </div>
            {alertaDeConflito}
          </section>
        </form>

        <aside aria-label="Resumo do agendamento" className="d-resumo d-narrow">
          {a.agendada ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="ok">
                <Traco d={CAMINHOS.certo} size={28} largura={2.6} color="#0B2A66" />
              </div>
              <h2>Consulta agendada</h2>
              <p>{textoDeSucesso(a.agendada)}</p>
              <Link href={`/agenda?data=${a.agendada.data}`} className="branco">
                Ver na agenda
              </Link>
              <button type="button" className="cta" style={{ height: 48 }} onClick={a.outra}>
                Agendar outra consulta
              </button>
            </div>
          ) : (
            <>
              <div className="eyebrow">Resumo</div>
              <dl>
                <div>
                  <dt>Animal · Tutor</dt>
                  <dd>{a.tutor ? `${a.animal?.nome ?? "escolha o animal"} · ${a.tutor.nome}` : "escolha o tutor"}</dd>
                </div>
                <div>
                  <dt>Veterinário</dt>
                  <dd>{a.prof?.nome ?? "—"}</dd>
                </div>
                <div>
                  <dt>Data e horário</dt>
                  <dd>{quandoResumo(a)}</dd>
                </div>
                <div>
                  <dt>Motivo</dt>
                  <dd>{a.motivo}</dd>
                </div>
              </dl>
              {a.erro && (
                <div role="alert" className="erro">
                  {a.erro}
                </div>
              )}
              <button type="button" className="cta" disabled={a.enviando} onClick={() => a.confirmar()}>
                {a.enviando ? "Agendando…" : "Confirmar agendamento"}
              </button>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
