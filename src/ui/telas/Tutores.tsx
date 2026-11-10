"use client";

// REQ 04 — Manter tutor · REQ 05 — Manter animal

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { dataBR, hojeLocal, mesAno } from "@/lib/datas";
import { api, ErroApi, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Lupa, Pata, Traco } from "../icones";
import { iniciais } from "../status";
import type { Animal, Tutor } from "../tipos";
import { useDados } from "../useDados";

type Modo = "ver" | "novo" | "editar";

const TUTOR_VAZIO = { nome: "", cpf: "", telefone: "", email: "", endereco: "", canalWhatsapp: true, canalEmail: true };
const ANIMAL_VAZIO = { nome: "", especie: "Canina", raca: "", sexo: "Fêmea", nascimento: "" };

function mascaraCpf(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const meio = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? "-" + d.slice(meio) : ""}`;
}

function canais(t: Tutor): string {
  if (t.canalWhatsapp && t.canalEmail) return "WhatsApp e e-mail";
  if (t.canalWhatsapp) return "WhatsApp";
  return t.canalEmail ? "E-mail" : "Não recebe lembretes";
}

function useTutores(q: URLSearchParams) {
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [selecionado, setSelecionado] = useState<number | null>(() => Number(q.get("tutor")) || null);
  const [modo, setModo] = useState<Modo>(() => (q.get("novo") ? "novo" : "ver"));
  const [form, setForm] = useState(TUTOR_VAZIO);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  /** Formulário de animal: fechado, novo ou editando o animal de id informado. */
  const [animalAberto, setAnimalAberto] = useState<null | "novo" | number>(() => (q.get("animal") === "novo" ? "novo" : null));
  const [formAnimal, setFormAnimal] = useState(ANIMAL_VAZIO);
  const [erroAnimal, setErroAnimal] = useState<{ campo?: string; texto: string } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setTermo(busca.trim()), 250);
    return () => window.clearTimeout(t);
  }, [busca]);

  const lista = useDados<{ tutores: Tutor[] }>(`/api/tutores${termo ? `?busca=${encodeURIComponent(termo)}` : ""}`);
  const tutores = lista.dados?.tutores ?? [];
  const tutor = tutores.find((t) => t.id === selecionado) ?? null;

  function limpar() {
    setErro("");
    setMsg("");
    setConfirmando(false);
    setAnimalAberto(null);
    setErroAnimal(null);
  }

  return {
    busca,
    setBusca,
    tutores,
    carregado: !!lista.dados,
    erroDaLista: lista.erro,
    tutor,
    selecionado,
    modo,
    form,
    erro,
    msg,
    confirmando,
    salvando,
    animalAberto,
    formAnimal,
    erroAnimal,
    setForm,
    setFormAnimal,
    selecionar(id: number | null) {
      limpar();
      setModo("ver");
      setSelecionado(id);
    },
    novo() {
      limpar();
      setForm(TUTOR_VAZIO);
      setModo("novo");
    },
    editar(t: Tutor) {
      limpar();
      setSelecionado(t.id);
      setForm({ nome: t.nome, cpf: t.cpf, telefone: t.telefone, email: t.email, endereco: t.endereco, canalWhatsapp: t.canalWhatsapp, canalEmail: t.canalEmail });
      setModo("editar");
    },
    cancelar() {
      setErro("");
      setModo("ver");
    },
    async salvar(): Promise<boolean> {
      const cpf = form.cpf.replace(/\D/g, "");
      if (!form.nome.trim() || !form.telefone.trim() || (modo === "novo" && cpf.length !== 11)) {
        setErro("Preencha nome, CPF e telefone. O CPF precisa ter 11 dígitos.");
        return false;
      }
      setSalvando(true);
      setErro("");
      try {
        const criando = modo === "novo";
        const { tutor: salvo } = await api<{ tutor: Tutor }>(criando ? "/api/tutores" : `/api/tutores/${selecionado}`, {
          metodo: criando ? "POST" : "PUT",
          corpo: form,
        });
        setBusca("");
        setTermo("");
        await lista.recarregar();
        setSelecionado(salvo.id);
        setModo("ver");
        setMsg(criando ? "Tutor cadastrado. Agora cadastre os animais dele abaixo." : "Dados do tutor atualizados.");
        if (criando) {
          setFormAnimal(ANIMAL_VAZIO);
          setAnimalAberto("novo");
        }
        return true;
      } catch (e) {
        setErro(mensagemDe(e));
        return false;
      } finally {
        setSalvando(false);
      }
    },
    pedirExclusao() {
      setMsg("");
      setConfirmando(true);
    },
    manter: () => setConfirmando(false),
    async excluir(t: Tutor): Promise<boolean> {
      setSalvando(true);
      try {
        const { consultasCanceladas: n } = await api<{ consultasCanceladas: number }>(`/api/tutores/${t.id}`, { metodo: "DELETE" });
        setConfirmando(false);
        setSelecionado(null);
        await lista.recarregar();
        setMsg(`O cadastro de ${t.nome} foi excluído.${n ? ` ${n === 1 ? "1 consulta futura foi cancelada" : `${n} consultas futuras foram canceladas`}.` : ""}`);
        return true;
      } catch (e) {
        setMsg("");
        setErro(mensagemDe(e));
        return false;
      } finally {
        setSalvando(false);
      }
    },
    abrirAnimal(a: Animal | "novo" | null) {
      setErroAnimal(null);
      setMsg("");
      if (a === null) return setAnimalAberto(null);
      if (a === "novo") {
        setFormAnimal(ANIMAL_VAZIO);
        return setAnimalAberto("novo");
      }
      setFormAnimal({ nome: a.nome, especie: a.especie, raca: a.raca, sexo: a.sexo, nascimento: a.nascimento });
      setAnimalAberto(a.id);
    },
    async salvarAnimal(tutorId: number) {
      if (!formAnimal.nome.trim()) return setErroAnimal({ campo: "nome", texto: "Informe o nome do animal." });
      if (!formAnimal.nascimento) return setErroAnimal({ campo: "nascimento", texto: "Informe a data de nascimento." });
      if (formAnimal.nascimento > hojeLocal()) return setErroAnimal({ campo: "nascimento", texto: "A data não pode estar no futuro." });
      setSalvando(true);
      setErroAnimal(null);
      try {
        const criando = animalAberto === "novo";
        await api(criando ? `/api/tutores/${tutorId}/animais` : `/api/animais/${animalAberto}`, { metodo: criando ? "POST" : "PUT", corpo: formAnimal });
        await lista.recarregar();
        setAnimalAberto(null);
        setMsg(criando ? `${formAnimal.nome.trim()} foi cadastrado e vinculado ao tutor.` : "Dados do animal atualizados.");
      } catch (e) {
        setErroAnimal({ campo: e instanceof ErroApi ? e.campo : undefined, texto: mensagemDe(e) });
      } finally {
        setSalvando(false);
      }
    },
    async excluirAnimal(a: Animal) {
      setSalvando(true);
      try {
        await api(`/api/animais/${a.id}`, { metodo: "DELETE" });
        await lista.recarregar();
        setAnimalAberto(null);
        setMsg(`O cadastro de ${a.nome} foi excluído.`);
      } catch (e) {
        setErroAnimal({ texto: mensagemDe(e) });
      } finally {
        setSalvando(false);
      }
    },
  };
}

type Estado = ReturnType<typeof useTutores>;

function CamposDoTutor({ s }: { s: Estado }) {
  const campo = (chave: "nome" | "cpf" | "telefone" | "email" | "endereco", valor: string) => s.setForm({ ...s.form, [chave]: valor });
  return (
    <>
      <div className="field">
        <label className="lbl" htmlFor="tn">
          Nome completo
        </label>
        <input className="inp" id="tn" autoComplete="off" placeholder="Ex.: Mariana Teixeira" value={s.form.nome} onChange={(e) => campo("nome", e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="tc">
          CPF
        </label>
        {s.modo === "novo" ? (
          <input className="inp" id="tc" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={s.form.cpf} onChange={(e) => campo("cpf", mascaraCpf(e.target.value))} />
        ) : (
          <input className="inp" id="tc" value={s.form.cpf} disabled title="O CPF não pode ser alterado depois do cadastro" />
        )}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="tt">
          Telefone / WhatsApp
        </label>
        <input className="inp" id="tt" type="tel" inputMode="tel" autoComplete="off" placeholder="(71) 90000-0000" value={s.form.telefone} onChange={(e) => campo("telefone", mascaraTelefone(e.target.value))} />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="te">
          E-mail
        </label>
        <input className="inp" id="te" type="email" inputMode="email" autoComplete="off" placeholder="nome@email.com" value={s.form.email} onChange={(e) => campo("email", e.target.value)} />
      </div>
    </>
  );
}

function Endereco({ s }: { s: Estado }) {
  return (
    <div className="field">
      <label className="lbl" htmlFor="ta">
        Endereço
      </label>
      <input className="inp" id="ta" autoComplete="off" placeholder="Rua, número · bairro, cidade" value={s.form.endereco} onChange={(e) => s.setForm({ ...s.form, endereco: e.target.value })} />
    </div>
  );
}

function Canais({ s, legenda, estilo }: { s: Estado; legenda: string; estilo?: React.CSSProperties }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="lbl" style={{ marginBottom: 8, padding: 0 }}>
        {legenda}
      </legend>
      <div style={estilo}>
        <label className="check">
          <input type="checkbox" checked={s.form.canalWhatsapp} onChange={(e) => s.setForm({ ...s.form, canalWhatsapp: e.target.checked })} />
          WhatsApp
        </label>
        <label className="check">
          <input type="checkbox" checked={s.form.canalEmail} onChange={(e) => s.setForm({ ...s.form, canalEmail: e.target.checked })} />
          E-mail
        </label>
      </div>
    </fieldset>
  );
}

function CamposDoAnimal({ s }: { s: Estado }) {
  const f = s.formAnimal;
  const erroEm = (campo: string) => s.erroAnimal?.campo === campo;
  const campo = (chave: keyof typeof f, valor: string) => s.setFormAnimal({ ...f, [chave]: valor });
  return {
    nome: (
      <div className="field">
        <label className="lbl" htmlFor="an">
          Nome do animal
        </label>
        <input className="inp" id="an" autoComplete="off" value={f.nome} aria-invalid={erroEm("nome") || undefined} onChange={(e) => campo("nome", e.target.value)} />
        {erroEm("nome") && <span className="alert s">{s.erroAnimal!.texto}</span>}
      </div>
    ),
    especie: (
      <div className="field">
        <label className="lbl" htmlFor="ae">
          Espécie
        </label>
        <select className="inp" id="ae" value={f.especie} onChange={(e) => campo("especie", e.target.value)}>
          <option>Canina</option>
          <option>Felina</option>
          <option>Outra</option>
        </select>
      </div>
    ),
    raca: (
      <div className="field">
        <label className="lbl" htmlFor="ar">
          Raça
        </label>
        <input className="inp" id="ar" autoComplete="off" placeholder="Ex.: Poodle, SRD" value={f.raca} onChange={(e) => campo("raca", e.target.value)} />
      </div>
    ),
    sexo: (
      <div className="field">
        <label className="lbl" htmlFor="as">
          Sexo
        </label>
        <select className="inp" id="as" value={f.sexo} onChange={(e) => campo("sexo", e.target.value)}>
          <option>Fêmea</option>
          <option>Macho</option>
        </select>
      </div>
    ),
    nascimento: (
      <div className="field">
        <label className="lbl" htmlFor="ad">
          Data de nascimento
        </label>
        <input className="inp" id="ad" type="date" max={hojeLocal()} value={f.nascimento} aria-invalid={erroEm("nascimento") || undefined} aria-describedby="ad-err" onChange={(e) => campo("nascimento", e.target.value)} />
        {erroEm("nascimento") && (
          <span id="ad-err" className="alert s">
            {s.erroAnimal!.texto}
          </span>
        )}
      </div>
    ),
  };
}

function ExcluirAnimal({ s, animal, classe }: { s: Estado; animal: Animal; classe: string }) {
  const [pedindo, setPedindo] = useState(false);
  if (!pedindo) {
    return (
      <button type="button" className={classe} onClick={() => setPedindo(true)}>
        Excluir animal
      </button>
    );
  }
  return (
    <div className="danger" style={{ gridColumn: "1 / -1" }}>
      <b>Excluir {animal.nome}?</b>
      <span className="small">As consultas futuras deste animal serão canceladas. O histórico fica guardado.</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className={classe.replace(/btnd/, "btn2")} style={{ flex: 1 }} onClick={() => setPedindo(false)}>
          Manter
        </button>
        <button type="button" className={classe.replace(/btnd/, "btnD")} style={{ flex: 1 }} disabled={s.salvando} onClick={() => s.excluirAnimal(animal)}>
          Excluir
        </button>
      </div>
    </div>
  );
}

const descricaoDosPets = (t: Tutor) => (t.animais.length ? t.animais.map((a) => a.nome).join(", ") : "Sem animais cadastrados");

function textoDosVinculados(n: number): string {
  return n === 0 ? "seu cadastro" : n === 1 ? "o animal vinculado" : `os ${n} animais vinculados`;
}

export function Tutores() {
  const { celular, permissoes } = useCasca();
  const q = useSearchParams();
  const s = useTutores(q);
  const podeEditar = permissoes.editarCadastros;
  const [tela, setTela] = useState<"lista" | "ficha">(() => (q.get("tutor") ? "ficha" : "lista"));
  const enviar = (acao: () => unknown) => (e: FormEvent) => {
    e.preventDefault();
    void acao();
  };

  // ---------- Celular ----------
  if (celular) {
    const t = s.tutor;
    const campos = CamposDoAnimal({ s });
    const editando = typeof s.animalAberto === "number" ? t?.animais.find((a) => a.id === s.animalAberto) : undefined;

    if (s.modo !== "ver") {
      const titulo = s.modo === "novo" ? "Novo tutor" : "Editar tutor";
      return (
        <>
          <TopoCelular
            titulo={titulo}
            esquerda={
              <button type="button" className="iconbtn" aria-label="Cancelar" onClick={s.cancelar}>
                <Traco d={CAMINHOS.fechar} size={22} largura={2.2} />
              </button>
            }
          />
          <main className="page withcta">
            <div className="eyebrow">REQ 04 · {titulo}</div>
            <form id="form-tutor" className="stack" aria-label={titulo} noValidate onSubmit={enviar(async () => (await s.salvar()) && setTela("ficha"))}>
              <CamposDoTutor s={s} />
              <Endereco s={s} />
              <Canais s={s} legenda="Receber lembretes por" />
              {s.erro && (
                <span role="alert" className="alert">
                  {s.erro}
                </span>
              )}
              {s.modo === "novo" && <span className="small muted">Depois de salvar, cadastre os animais na ficha do tutor.</span>}
            </form>
          </main>
          <div className="ctabar">
            <button type="submit" form="form-tutor" className="btn" disabled={s.salvando}>
              {s.salvando ? "Salvando…" : s.modo === "novo" ? "Cadastrar tutor" : "Salvar alterações"}
            </button>
          </div>
        </>
      );
    }

    if (tela === "ficha" && t) {
      return (
        <>
          <TopoCelular
            titulo="Ficha do tutor"
            esquerda={
              <button
                type="button"
                className="iconbtn"
                aria-label="Voltar para a lista"
                onClick={() => {
                  s.selecionar(null);
                  setTela("lista");
                }}
              >
                <Traco d={CAMINHOS.voltar} size={24} largura={2.2} />
              </button>
            }
          />
          <main className="page">
            {s.msg && (
              <div role="status" className="msg">
                {s.msg}
              </div>
            )}
            {s.erro && (
              <div role="alert" className="erro">
                {s.erro}
              </div>
            )}
            <div>
              <h2 className="h1">{t.nome}</h2>
              <span className="small muted">Cliente desde {mesAno(t.criadoEm)}</span>
            </div>
            {podeEditar && (
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn2" onClick={() => s.editar(t)}>
                  Editar dados
                </button>
                <button type="button" className="btnd" onClick={s.pedirExclusao}>
                  Excluir
                </button>
              </div>
            )}
            {s.confirmando && (
              <div className="danger">
                <b>
                  Excluir {t.nome} e {textoDosVinculados(t.animais.length)}?
                </b>
                <span className="small">As consultas futuras serão canceladas. O histórico já registrado fica guardado.</span>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn2" onClick={s.manter}>
                    Manter
                  </button>
                  <button type="button" className="btnD" disabled={s.salvando} onClick={async () => (await s.excluir(t)) && setTela("lista")}>
                    Excluir tutor
                  </button>
                </div>
              </div>
            )}
            <section className="card">
              <dl className="dl col">
                <dt>CPF</dt>
                <dd>{t.cpf}</dd>
                <dt>Telefone / WhatsApp</dt>
                <dd>
                  <a href={`tel:${t.telefone.replace(/\D/g, "")}`}>{t.telefone}</a>
                </dd>
                <dt>E-mail</dt>
                <dd>{t.email || "—"}</dd>
                <dt>Endereço</dt>
                <dd>{t.endereco || "—"}</dd>
                <dt>Notificações</dt>
                <dd style={{ marginBottom: 0 }}>{canais(t)}</dd>
              </dl>
            </section>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h2">Animais</h2>
              {podeEditar && (
                <button type="button" className="link" onClick={() => s.abrirAnimal(s.animalAberto === "novo" ? null : "novo")}>
                  {s.animalAberto === "novo" ? "Fechar formulário" : "+ Adicionar animal"}
                </button>
              )}
            </div>
            {t.animais.length === 0 && s.animalAberto !== "novo" && <p className="vazio">Nenhum animal cadastrado para este tutor.</p>}
            {t.animais.map((a) => (
              <article key={a.id} className="card stack" style={{ gap: 10 }}>
                <div className="row">
                  <span className="pawbox">
                    <Pata size={24} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 17 }}>{a.nome}</b>
                    <div className="small muted">
                      {[a.especie, a.raca, a.sexo].filter(Boolean).join(" · ")} · nasc. {dataBR(a.nascimento)}
                    </div>
                  </div>
                </div>
                {(podeEditar || permissoes.agendar) && (
                  <div className="row" style={{ gap: 8 }}>
                    {podeEditar && (
                      <button type="button" className="btn2 sm" onClick={() => s.abrirAnimal(a)}>
                        Editar
                      </button>
                    )}
                    {permissoes.agendar && (
                      <Link className="btn sm" href={`/agenda/novo?tutor=${t.id}&animal=${a.id}`}>
                        Agendar
                      </Link>
                    )}
                  </div>
                )}
              </article>
            ))}
            {s.animalAberto !== null && (
              <form className="card stack" aria-label={editando ? "Editar animal" : "Cadastrar animal"} style={{ border: "2px solid #3651D9" }} noValidate onSubmit={enviar(() => s.salvarAnimal(t.id))}>
                <h2 className="h2">{editando ? `Editar ${editando.nome}` : "Novo animal"}</h2>
                {campos.nome}
                <div className="grid2">
                  {campos.especie}
                  {campos.sexo}
                </div>
                {campos.raca}
                {campos.nascimento}
                {s.erroAnimal && !["nome", "nascimento"].includes(s.erroAnimal.campo ?? "") && (
                  <span role="alert" className="alert">
                    {s.erroAnimal.texto}
                  </span>
                )}
                <button type="submit" className="btn" disabled={s.salvando}>
                  {s.salvando ? "Salvando…" : "Salvar animal"}
                </button>
                {editando && <ExcluirAnimal s={s} animal={editando} classe="btnd" />}
              </form>
            )}
          </main>
        </>
      );
    }

    return (
      <>
        <TopoCelular titulo="Tutores e animais" />
        <main className="page">
          <div className="eyebrow">REQ 04 · REQ 05</div>
          <label className="search">
            <Lupa size={20} />
            <input type="search" aria-label="Buscar tutor ou animal" placeholder="Nome, CPF, telefone ou animal" value={s.busca} onChange={(e) => s.setBusca(e.target.value)} />
          </label>
          {s.msg && (
            <div role="status" className="msg">
              {s.msg}
            </div>
          )}
          {s.erroDaLista && (
            <div role="alert" className="erro">
              {s.erroDaLista}
            </div>
          )}
          {s.carregado && s.tutores.length === 0 ? (
            <p className="vazio">{s.busca ? "Nenhum tutor encontrado para esta busca." : "Nenhum tutor cadastrado ainda."}</p>
          ) : (
            <ul className="list card" style={{ padding: "4px 16px" }}>
              {s.tutores.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    className="lrow"
                    onClick={() => {
                      s.selecionar(x.id);
                      setTela("ficha");
                      window.scrollTo(0, 0);
                    }}
                  >
                    <span className="av" style={{ background: "#E4F1DC", color: "#2F5D1E" }}>
                      {iniciais(x.nome)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <b style={{ display: "block" }}>{x.nome}</b>
                      <span className="small muted">{descricaoDosPets(x)}</span>
                    </span>
                    <Traco d={CAMINHOS.seta} size={20} largura={2} color="#5B6782" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
        {podeEditar && (
          <button type="button" className="fab" onClick={s.novo}>
            <Traco d={CAMINHOS.mais} size={22} largura={2.4} />
            Novo tutor
          </button>
        )}
      </>
    );
  }

  // ---------- Desktop ----------
  const t = s.tutor ?? s.tutores[0] ?? null;
  const campos = CamposDoAnimal({ s });
  const editando = typeof s.animalAberto === "number" ? t?.animais.find((a) => a.id === s.animalAberto) : undefined;
  const titulo = s.modo === "novo" ? "Novo tutor" : "Editar tutor";
  let painel: ReactNode;

  if (s.modo !== "ver") {
    painel = (
      <form aria-label={titulo} className="d-card" style={{ border: "2px solid #3651D9", display: "flex", flexDirection: "column", gap: 16 }} noValidate onSubmit={enviar(s.salvar)}>
        <div>
          <div className="eyebrow t">REQ 04 · {titulo}</div>
          <h2 className="h2" style={{ margin: "4px 0 0", fontSize: 28 }}>
            {titulo}
          </h2>
        </div>
        <div className="d-form2">
          <CamposDoTutor s={s} />
        </div>
        <Endereco s={s} />
        <Canais s={s} legenda="Receber lembretes de consultas e vacinas por" estilo={{ display: "flex", gap: 20, flexWrap: "wrap" }} />
        {s.erro && (
          <span role="alert" className="alert">
            {s.erro}
          </span>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="d-btn" style={{ flex: "0 1 220px", height: 48 }} disabled={s.salvando}>
            {s.salvando ? "Salvando…" : s.modo === "novo" ? "Cadastrar tutor" : "Salvar alterações"}
          </button>
          <button type="button" className="d-btn2" style={{ flex: "0 1 160px", height: 48 }} onClick={s.cancelar}>
            Cancelar
          </button>
        </div>
        {s.modo === "novo" && <span style={{ fontSize: 14, color: "#5B6782" }}>Depois de salvar, cadastre os animais deste tutor na própria ficha.</span>}
      </form>
    );
  } else if (!t) {
    painel = (
      <section className="d-card">
        {s.msg && (
          <div role="status" className="msg" style={{ marginBottom: 12 }}>
            {s.msg}
          </div>
        )}
        <p className="d-vazio">{s.carregado ? "Selecione um tutor na lista ou cadastre um novo." : "Carregando…"}</p>
      </section>
    );
  } else {
    painel = (
      <>
        <section aria-label="Ficha do tutor" className="d-card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {s.msg && (
            <div role="status" className="msg">
              {s.msg}
            </div>
          )}
          {s.erro && (
            <div role="alert" className="danger">
              {s.erro}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div className="eyebrow t">Ficha do tutor</div>
              <h2 className="h2" style={{ margin: "4px 0 0", fontSize: 28 }}>
                {t.nome}
              </h2>
              <span style={{ fontSize: 14, color: "#5B6782" }}>Cliente desde {mesAno(t.criadoEm)}</span>
            </div>
            {podeEditar && (
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="d-btn2 s14" onClick={() => s.editar(t)}>
                  Editar dados
                </button>
                <button type="button" className="d-btnd s14" onClick={s.pedirExclusao}>
                  Excluir
                </button>
              </div>
            )}
          </div>
          {s.confirmando && (
            <div className="danger">
              <strong>
                Excluir {t.nome} e {textoDosVinculados(t.animais.length)}?
              </strong>
              <span>As consultas futuras serão canceladas. O histórico já registrado fica guardado no banco de dados da clínica.</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="d-btn2 s14" style={{ flex: "1 1 140px" }} onClick={s.manter}>
                  Manter cadastro
                </button>
                <button type="button" className="d-btnD s14" style={{ flex: "1 1 140px" }} disabled={s.salvando} onClick={() => s.excluir(t)}>
                  Excluir tutor
                </button>
              </div>
            </div>
          )}
          <dl className="d-dados">
            <div>
              <dt>CPF</dt>
              <dd>{t.cpf}</dd>
            </div>
            <div>
              <dt>Telefone / WhatsApp</dt>
              <dd>{t.telefone}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{t.email || "—"}</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>{t.endereco || "—"}</dd>
            </div>
            <div>
              <dt>Recebe notificações por</dt>
              <dd>{canais(t)}</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Animais do tutor" className="d-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 className="h2">Animais vinculados</h2>
            {podeEditar && (
              <button type="button" className="d-btn2 s14" onClick={() => s.abrirAnimal(s.animalAberto === "novo" ? null : "novo")}>
                {s.animalAberto === "novo" ? "Fechar formulário" : "+ Adicionar animal"}
              </button>
            )}
          </div>
          {t.animais.length === 0 ? (
            <p className="d-vazio" style={{ padding: 8 }}>
              Nenhum animal cadastrado para este tutor.
            </p>
          ) : (
            <div className="d-pets">
              {t.animais.map((a) => (
                <article key={a.id} className="d-pet">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className="pawbox">
                      <Pata />
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{a.nome}</div>
                      <div style={{ fontSize: 14, color: "#5B6782" }}>{[a.especie, a.raca].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#3D4A63" }}>
                    <span>{a.sexo}</span>
                    <span>Nasc. {dataBR(a.nascimento)}</span>
                  </div>
                  {(podeEditar || permissoes.agendar) && (
                    <div className="btns">
                      {podeEditar && (
                        <button type="button" className="o" onClick={() => s.abrirAnimal(a)}>
                          Editar
                        </button>
                      )}
                      {permissoes.agendar && (
                        <Link href={`/agenda/novo?tutor=${t.id}&animal=${a.id}`} className="p">
                          Agendar
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {s.animalAberto !== null && (
            <form aria-label={editando ? "Editar animal" : "Cadastrar animal"} className="d-form3" style={{ borderTop: "1px solid #DCE3EF", paddingTop: 18 }} noValidate onSubmit={enviar(() => s.salvarAnimal(t.id))}>
              <div className="eyebrow t" style={{ gridColumn: "1 / -1" }}>
                REQ 05 · {editando ? `Editar ${editando.nome}` : "Novo animal"}
              </div>
              {campos.nome}
              {campos.especie}
              {campos.raca}
              {campos.sexo}
              {campos.nascimento}
              <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 23 }}>
                <button type="submit" className="d-btn" style={{ width: "100%" }} disabled={s.salvando}>
                  {s.salvando ? "Salvando…" : "Salvar animal"}
                </button>
              </div>
              {s.erroAnimal && !["nome", "nascimento"].includes(s.erroAnimal.campo ?? "") && (
                <span role="alert" className="alert" style={{ gridColumn: "1 / -1" }}>
                  {s.erroAnimal.texto}
                </span>
              )}
              {editando && <ExcluirAnimal s={s} animal={editando} classe="d-btnd s14" />}
            </form>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <header className="d-head">
        <div>
          <div className="eyebrow">REQ 04 · Manter tutor · REQ 05 · Manter animal</div>
          <h1>Tutores e animais</h1>
        </div>
        {podeEditar && (
          <button type="button" className="d-btn" onClick={s.novo}>
            + Novo tutor
          </button>
        )}
      </header>

      <div className="d-cols">
        <section aria-label="Lista de tutores" className="d-card d-narrow" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="d-search">
            <Lupa />
            <input aria-label="Buscar tutor ou animal" placeholder="Nome, CPF, telefone ou animal" value={s.busca} onChange={(e) => s.setBusca(e.target.value)} />
          </label>
          {s.erroDaLista && (
            <div role="alert" className="danger">
              {s.erroDaLista}
            </div>
          )}
          {s.carregado && s.tutores.length === 0 && <p className="d-vazio">{s.busca ? "Nenhum tutor encontrado para esta busca." : "Nenhum tutor cadastrado ainda."}</p>}
          <ul className="d-tlist">
            {s.tutores.map((x) => (
              <li key={x.id}>
                <button type="button" className="d-trow" aria-pressed={s.modo !== "novo" && x.id === t?.id} onClick={() => s.selecionar(x.id)}>
                  <span className="av">{iniciais(x.nome)}</span>
                  <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <b>{x.nome}</b>
                    <small>{descricaoDosPets(x)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="d-wide" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {painel}
        </div>
      </div>
    </>
  );
}
