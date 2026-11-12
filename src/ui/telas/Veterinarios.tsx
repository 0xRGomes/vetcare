"use client";

// REQ 06 — Manter veterinários e seus horários de atendimento.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Traco } from "../icones";
import { iniciais } from "../status";
import type { Profissional } from "../tipos";
import { useDados } from "../useDados";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HORARIO_INICIAL = { horaInicio: "08:00", horaFim: "17:00" };

interface Aviso {
  destino: string;
  texto: string;
  senha?: { nome: string; email: string; valor: string };
}

let avisoLembrado: Aviso | null = null;

function FormularioVeterinario({
  profissional,
  celular,
  podeGerenciar,
  aoConcluir,
}: {
  profissional: Profissional | null;
  celular: boolean;
  podeGerenciar: boolean;
  aoConcluir: (aviso: Aviso) => Promise<void>;
}) {
  const novo = profissional === null;
  const [nome, setNome] = useState(profissional?.nome ?? "");
  const [crmv, setCrmv] = useState(profissional?.crmv ?? "");
  const [especialidade, setEspecialidade] = useState(profissional?.especialidade ?? "");
  const [dias, setDias] = useState<number[]>(profissional?.dias ?? [1, 2, 3, 4, 5]);
  const [horaInicio, setHoraInicio] = useState(profissional?.horaInicio ?? HORARIO_INICIAL.horaInicio);
  const [horaFim, setHoraFim] = useState(profissional?.horaFim ?? HORARIO_INICIAL.horaFim);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (nome.trim().length < 3) return setErro("Informe o nome completo do veterinário.");
    if (!crmv.trim()) return setErro("Informe o CRMV.");
    if (!especialidade.trim()) return setErro("Informe a especialidade.");
    if (!dias.length) return setErro("Selecione ao menos um dia de atendimento.");
    if (!horaInicio || !horaFim || horaInicio >= horaFim) return setErro("Informe um horário de atendimento válido.");
    if (novo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErro("Informe um e-mail de acesso válido.");

    setSalvando(true);
    setErro("");
    try {
      const corpo = { nome, crmv, especialidade, dias, horaInicio, horaFim, ...(novo ? { email } : {}) };
      if (novo) {
        const resultado = await api<{ profissional: Profissional; senhaProvisoria: string }>("/api/profissionais", { metodo: "POST", corpo });
        await aoConcluir({
          destino: `/veterinarios/${resultado.profissional.id}`,
          texto: "Veterinário cadastrado. A conta de acesso também foi criada.",
          senha: { nome: resultado.profissional.nome, email, valor: resultado.senhaProvisoria },
        });
      } else {
        const resultado = await api<{ profissional: Profissional }>(`/api/profissionais/${profissional.id}`, { metodo: "PUT", corpo });
        await aoConcluir({ destino: `/veterinarios/${resultado.profissional.id}`, texto: "Cadastro atualizado." });
      }
    } catch (falha) {
      setErro(mensagemDe(falha));
      setSalvando(false);
    }
  }

  async function remover() {
    if (!profissional) return;
    setSalvando(true);
    setErro("");
    try {
      await api(`/api/profissionais/${profissional.id}`, { metodo: "DELETE" });
      await aoConcluir({ destino: "/veterinarios", texto: "Veterinário removido da agenda; o histórico foi preservado." });
    } catch (falha) {
      setErro(mensagemDe(falha));
      setSalvando(false);
    }
  }

  const botoesDeDias = (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="lbl" style={{ marginBottom: 8 }}>Dias de atendimento</legend>
      <div className={celular ? "wrapchips" : "d-actions"}>
        {DIAS.map((dia, indice) => (
          <button
            key={dia}
            type="button"
            className={celular ? "chip" : "d-chip"}
            aria-pressed={dias.includes(indice)}
            style={dias.includes(indice) ? { background: "#0B3A8F", color: "#FFFFFF", borderColor: "#0B3A8F" } : undefined}
            onClick={() => setDias((anteriores) => anteriores.includes(indice) ? anteriores.filter((d) => d !== indice) : [...anteriores, indice].sort((a, b) => a - b))}
          >
            {dia}
          </button>
        ))}
      </div>
    </fieldset>
  );

  const campos = (
    <>
      <div className="field">
        <label className="lbl" htmlFor="veterinario-nome">Nome completo</label>
        <input className="inp" id="veterinario-nome" autoComplete="name" value={nome} onChange={(event) => setNome(event.target.value)} disabled={!podeGerenciar || salvando} />
      </div>
      <div className="grid2">
        <div className="field">
          <label className="lbl" htmlFor="veterinario-crmv">CRMV</label>
          <input className="inp" id="veterinario-crmv" autoComplete="off" value={crmv} onChange={(event) => setCrmv(event.target.value)} disabled={!podeGerenciar || salvando} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="veterinario-especialidade">Especialidade</label>
          <input className="inp" id="veterinario-especialidade" autoComplete="off" value={especialidade} onChange={(event) => setEspecialidade(event.target.value)} disabled={!podeGerenciar || salvando} />
        </div>
      </div>
      {novo && (
        <div className="field">
          <label className="lbl" htmlFor="veterinario-email">E-mail de acesso</label>
          <input className="inp" id="veterinario-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!podeGerenciar || salvando} />
          <span className="small muted">Será criada uma conta com perfil Veterinário e senha provisória.</span>
        </div>
      )}
      {botoesDeDias}
      <div className="grid2">
        <div className="field">
          <label className="lbl" htmlFor="veterinario-inicio">Início</label>
          <input className="inp" id="veterinario-inicio" type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} disabled={!podeGerenciar || salvando} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="veterinario-fim">Fim</label>
          <input className="inp" id="veterinario-fim" type="time" value={horaFim} onChange={(event) => setHoraFim(event.target.value)} disabled={!podeGerenciar || salvando} />
        </div>
      </div>
      {erro && <span role="alert" className="alert">{erro}</span>}
      {podeGerenciar && !celular && (
        <div className={celular ? "stack" : "d-actions"}>
          <button type="submit" className={celular ? "btn" : "d-btn"} disabled={salvando}>
            {salvando ? "Salvando…" : novo ? "Cadastrar veterinário" : "Salvar alterações"}
          </button>
          {novo && (
            <Link className={celular ? "btn2" : "d-btn2"} href="/veterinarios">
              Cancelar
            </Link>
          )}
        </div>
      )}
      {!novo && podeGerenciar && (
        <div className="stack" style={{ paddingTop: 16, borderTop: "1px solid #DCE3EF" }}>
          {!confirmandoRemocao ? (
            <button type="button" className={celular ? "btnd" : "d-btnd"} disabled={salvando} onClick={() => setConfirmandoRemocao(true)}>
              Remover da agenda
            </button>
          ) : (
            <div className="danger">
              <strong>Remover {profissional.nome} da agenda?</strong>
              <span className="small">O acesso do veterinário será desativado. O histórico será mantido. Primeiro, cancele ou remaneje as consultas futuras.</span>
              <div className="row">
                <button type="button" className={celular ? "btn2" : "d-btn2"} disabled={salvando} onClick={() => setConfirmandoRemocao(false)}>Manter</button>
                <button type="button" className={celular ? "btnD" : "d-btnD"} disabled={salvando} onClick={() => void remover()}>
                  {salvando ? "Removendo…" : "Confirmar remoção"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (celular) {
    return (
      <>
        <form id="form-veterinario" className="stack" aria-label={novo ? "Novo veterinário" : `Editar ${profissional?.nome ?? "veterinário"}`} noValidate onSubmit={salvar}>
          {campos}
        </form>
        {podeGerenciar && <div className="ctabar"><button type="submit" form="form-veterinario" className="btn" disabled={salvando}>{salvando ? "Salvando…" : novo ? "Cadastrar veterinário" : "Salvar alterações"}</button></div>}
      </>
    );
  }

  return (
    <form className="stack" aria-label={novo ? "Novo veterinário" : `Editar ${profissional?.nome ?? "veterinário"}`} noValidate onSubmit={salvar}>
      {campos}
    </form>
  );
}

export function Veterinarios() {
  const { celular, permissoes } = useCasca();
  const router = useRouter();
  const params = useParams<{ rota?: string[] }>();
  const [parte] = params.rota ?? [];
  const novo = parte === "novo";
  const id = parte && !novo ? Number(parte) : null;
  const caminho = "/veterinarios" + (parte ? `/${parte}` : "");
  const dados = useDados<{ profissionais: Profissional[] }>("/api/profissionais");
  const profissional = id && Number.isInteger(id) ? dados.dados?.profissionais.find((p) => p.id === id) ?? null : null;
  const podeGerenciar = permissoes.gerenciarVeterinarios;
  const [aviso, definirAviso] = useState<Aviso | null>(() => {
    if (avisoLembrado?.destino === caminho) {
      const lembrado = avisoLembrado;
      avisoLembrado = null;
      return lembrado;
    }
    avisoLembrado = null;
    return null;
  });
  const msg = aviso?.destino === caminho ? aviso : null;

  async function concluir(resultado: Aviso) {
    await dados.recarregar();
    avisoLembrado = resultado;
    definirAviso(resultado);
    router.push(resultado.destino);
  }

  const notificacoes = (
    <>
      {msg && <div role="status" className="msg">{msg.texto}</div>}
      {msg?.senha && (
        <div className="senha-provisoria" role="status">
          <span>Senha provisória de {msg.senha.nome} ({msg.senha.email})</span>
          <code>{msg.senha.valor}</code>
          <small>Anote e informe ao veterinário agora: ela não será exibida novamente. No primeiro acesso, ele definirá a própria senha.</small>
        </div>
      )}
    </>
  );

  if (novo || id) {
    if (!podeGerenciar) {
      if (celular) {
        return (
          <>
            <TopoCelular titulo="Veterinários" esquerda={<Link className="iconbtn" href="/veterinarios" aria-label="Voltar"><Traco d={CAMINHOS.voltar} size={24} largura={2.2} /></Link>} />
            <main className="page"><div role="alert" className="erro">Somente a administração pode cadastrar ou alterar veterinários.</div></main>
          </>
        );
      }
      return <div role="alert" className="danger">Somente a administração pode cadastrar ou alterar veterinários.</div>;
    }

    if (id && (!dados.dados || !profissional)) {
      if (!dados.dados) return <p className={celular ? "vazio" : "d-vazio"}>Carregando veterinário…</p>;
      return (
        <div className={celular ? "page" : "d-card"}>
          <p className={celular ? "vazio" : "d-vazio"}>Veterinário não encontrado.</p>
          <Link className={celular ? "btn2" : "d-btn2"} href="/veterinarios">Voltar à lista</Link>
        </div>
      );
    }

    const formulario = <FormularioVeterinario key={caminho} profissional={novo ? null : profissional} celular={celular} podeGerenciar={podeGerenciar} aoConcluir={concluir} />;
    if (celular) {
      return (
        <>
          <TopoCelular titulo={novo ? "Novo veterinário" : "Editar veterinário"} esquerda={<Link className="iconbtn" href="/veterinarios" aria-label="Voltar para a lista"><Traco d={CAMINHOS.voltar} size={24} largura={2.2} /></Link>} />
          <main className="page withcta">{notificacoes}{formulario}</main>
        </>
      );
    }
    return (
      <>
        <header className="d-head">
          <div><div className="eyebrow">REQ 06 · Manter veterinário</div><h1>{novo ? "Novo veterinário" : "Editar veterinário"}</h1></div>
          <Link className="d-btn2" href="/veterinarios">Voltar à lista</Link>
        </header>
        {notificacoes}
        <section className="d-card" style={{ maxWidth: 720 }}>{formulario}</section>
      </>
    );
  }

  const lista = dados.dados?.profissionais ?? [];
  const cartoes = lista.map((p) => (
    <article key={p.id} className={celular ? "card stack" : "d-card stack"} style={{ gap: 12 }}>
      <div className="row">
        <span className="av" style={{ background: "#E6EBFF", color: "#2B3FB3" }}>{iniciais(p.nome)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{p.nome}</b>
          <div className="mono small muted">CRMV {p.crmv}</div>
        </div>
      </div>
      <span className="pill" style={{ background: "#E6EBFF", color: "#2B3FB3", alignSelf: "flex-start" }}>{p.especialidade}</span>
      <div className="small"><b>Atende:</b> {p.dias.map((dia) => DIAS[dia]).join(", ")}</div>
      <div className="small"><b>Horário:</b> {p.horaInicio}–{p.horaFim}</div>
      {podeGerenciar && <Link className={celular ? "btn2" : "d-btn2"} href={`/veterinarios/${p.id}`}>Editar</Link>}
    </article>
  ));

  if (celular) {
    return (
      <>
        <TopoCelular titulo="Veterinários" />
        <main className="page">
          <div><div className="eyebrow">REQ 06 · Manter veterinário</div><p className="sub">Profissionais, especialidades e horários da clínica.</p></div>
          {notificacoes}
          {dados.erro && <div role="alert" className="erro">{dados.erro}</div>}
          {dados.dados && lista.length === 0 && <p className="vazio">Nenhum veterinário cadastrado.</p>}
          <section className="stack" aria-label="Equipe de veterinários">{cartoes}</section>
        </main>
        {podeGerenciar && <Link className="fab" href="/veterinarios/novo" style={{ textDecoration: "none", color: "#FFFFFF" }}><Traco d={CAMINHOS.mais} size={22} largura={2.4} />Novo veterinário</Link>}
      </>
    );
  }

  return (
    <>
      <header className="d-head">
        <div><div className="eyebrow">REQ 06 · Manter veterinário</div><h1>Veterinários</h1><p className="sub">Profissionais, especialidades e horários que alimentam a agenda.</p></div>
        {podeGerenciar && <Link className="d-btn" href="/veterinarios/novo">+ Novo veterinário</Link>}
      </header>
      {notificacoes}
      {dados.erro && <div role="alert" className="danger">{dados.erro}</div>}
      {dados.dados && lista.length === 0 && <p className="d-vazio">Nenhum veterinário cadastrado.</p>}
      <section aria-label="Equipe de veterinários" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>{cartoes}</section>
    </>
  );
}
