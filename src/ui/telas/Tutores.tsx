"use client";

// REQ 04 — Manter tutor · REQ 05 — Manter animal
//
// Cada estado da tela tem endereço próprio:
//   /tutores                         lista
//   /tutores/novo                    novo tutor
//   /tutores/:id                     ficha do tutor
//   /tutores/:id/editar              editar tutor
//   /tutores/:id/animais/novo        novo animal
//   /tutores/:id/animais/:animal     editar animal

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { dataBR, hojeLocal, mesAno } from "@/lib/datas";
import { api, ErroApi, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Lupa, Pata, Traco } from "../icones";
import { iniciais } from "../status";
import type { Animal, Tutor } from "../tipos";
import { useDados } from "../useDados";

type Modo = "ver" | "novo" | "editar";
type ErroDeCampo = { campo?: string; texto: string } | null;

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

const descricaoDosPets = (t: Tutor) => (t.animais.length ? t.animais.map((a) => a.nome).join(", ") : "Sem animais cadastrados");

function textoDosVinculados(n: number): string {
  return n === 0 ? "seu cadastro" : n === 1 ? "o animal vinculado" : `os ${n} animais vinculados`;
}

/** Interpreta o trecho do endereço depois de /tutores. */
function lerRota(rota: string[]) {
  const [a, b, c] = rota;
  if (a === "novo") return { modo: "novo" as Modo, id: null, animal: null };
  const id = a ? Number(a) : null;
  const animal: null | "novo" | number = b === "animais" ? (c === "novo" ? "novo" : Number(c) || null) : null;
  return { modo: (b === "editar" ? "editar" : "ver") as Modo, id, animal };
}

// ---------- Formulário do tutor ----------

function FormTutor({ tutor, celular, aoSalvar, aoCancelar }: { tutor: Tutor | null; celular: boolean; aoSalvar: (t: Tutor, criado: boolean) => void; aoCancelar: () => void }) {
  const novo = tutor === null;
  const [f, setF] = useState(
    tutor
      ? { nome: tutor.nome, cpf: tutor.cpf, telefone: tutor.telefone, email: tutor.email, endereco: tutor.endereco, canalWhatsapp: tutor.canalWhatsapp, canalEmail: tutor.canalEmail }
      : { nome: "", cpf: "", telefone: "", email: "", endereco: "", canalWhatsapp: true, canalEmail: true },
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const titulo = novo ? "Novo tutor" : "Editar tutor";
  const rotuloSalvar = salvando ? "Salvando…" : novo ? "Cadastrar tutor" : "Salvar alterações";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!f.nome.trim() || !f.telefone.trim() || (novo && f.cpf.replace(/\D/g, "").length !== 11)) {
      setErro("Preencha nome, CPF e telefone. O CPF precisa ter 11 dígitos.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const { tutor: salvo } = await api<{ tutor: Tutor }>(novo ? "/api/tutores" : `/api/tutores/${tutor.id}`, { metodo: novo ? "POST" : "PUT", corpo: f });
      aoSalvar(salvo, novo);
    } catch (falha) {
      setErro(mensagemDe(falha));
      setSalvando(false);
    }
  }

  const texto = (chave: "nome" | "cpf" | "telefone" | "email" | "endereco", valor: string) => setF({ ...f, [chave]: valor });
  const campos = (
    <>
      <div className="field">
        <label className="lbl" htmlFor="tn">
          Nome completo
        </label>
        <input className="inp" id="tn" autoComplete="off" placeholder="Ex.: Mariana Teixeira" value={f.nome} onChange={(e) => texto("nome", e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="tc">
          CPF
        </label>
        {novo ? (
          <input className="inp" id="tc" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={f.cpf} onChange={(e) => texto("cpf", mascaraCpf(e.target.value))} />
        ) : (
          <input className="inp" id="tc" value={f.cpf} disabled title="O CPF não pode ser alterado depois do cadastro" />
        )}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="tt">
          Telefone / WhatsApp
        </label>
        <input className="inp" id="tt" type="tel" inputMode="tel" autoComplete="off" placeholder="(71) 90000-0000" value={f.telefone} onChange={(e) => texto("telefone", mascaraTelefone(e.target.value))} />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="te">
          E-mail
        </label>
        <input className="inp" id="te" type="email" inputMode="email" autoComplete="off" placeholder="nome@email.com" value={f.email} onChange={(e) => texto("email", e.target.value)} />
      </div>
    </>
  );
  const endereco = (
    <div className="field">
      <label className="lbl" htmlFor="ta">
        Endereço
      </label>
      <input className="inp" id="ta" autoComplete="off" placeholder="Rua, número · bairro, cidade" value={f.endereco} onChange={(e) => texto("endereco", e.target.value)} />
    </div>
  );
  const lembretes = (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="lbl" style={{ marginBottom: 8, padding: 0 }}>
        {celular ? "Receber lembretes por" : "Receber lembretes de consultas e vacinas por"}
      </legend>
      <div style={celular ? undefined : { display: "flex", gap: 20, flexWrap: "wrap" }}>
        <label className="check">
          <input type="checkbox" checked={f.canalWhatsapp} onChange={(e) => setF({ ...f, canalWhatsapp: e.target.checked })} />
          WhatsApp
        </label>
        <label className="check">
          <input type="checkbox" checked={f.canalEmail} onChange={(e) => setF({ ...f, canalEmail: e.target.checked })} />
          E-mail
        </label>
      </div>
    </fieldset>
  );
  const alerta = erro && (
    <span role="alert" className="alert">
      {erro}
    </span>
  );

  if (celular) {
    return (
      <>
        <TopoCelular
          titulo={titulo}
          esquerda={
            <button type="button" className="iconbtn" aria-label="Cancelar" onClick={aoCancelar}>
              <Traco d={CAMINHOS.fechar} size={22} largura={2.2} />
            </button>
          }
        />
        <main className="page withcta">
          <div className="eyebrow">REQ 04 · {titulo}</div>
          <form id="form-tutor" className="stack" aria-label={titulo} noValidate onSubmit={enviar}>
            {campos}
            {endereco}
            {lembretes}
            {alerta}
            {novo && <span className="small muted">Depois de salvar, cadastre os animais na ficha do tutor.</span>}
          </form>
        </main>
        <div className="ctabar">
          <button type="submit" form="form-tutor" className="btn" disabled={salvando}>
            {rotuloSalvar}
          </button>
        </div>
      </>
    );
  }

  return (
    <form aria-label={titulo} className="d-card" style={{ border: "2px solid #3651D9", display: "flex", flexDirection: "column", gap: 16 }} noValidate onSubmit={enviar}>
      <div>
        <div className="eyebrow t">REQ 04 · {titulo}</div>
        <h2 className="h2" style={{ margin: "4px 0 0", fontSize: 28 }}>
          {titulo}
        </h2>
      </div>
      <div className="d-form2">{campos}</div>
      {endereco}
      {lembretes}
      {alerta}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="submit" className="d-btn" style={{ flex: "0 1 220px", height: 48 }} disabled={salvando}>
          {rotuloSalvar}
        </button>
        <button type="button" className="d-btn2" style={{ flex: "0 1 160px", height: 48 }} onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
      {novo && <span style={{ fontSize: 14, color: "#5B6782" }}>Depois de salvar, cadastre os animais deste tutor na própria ficha.</span>}
    </form>
  );
}

// ---------- Formulário do animal ----------

function FormAnimal({ tutorId, animal, celular, aoSalvar, aoExcluir }: { tutorId: number; animal: Animal | null; celular: boolean; aoSalvar: (texto: string) => void; aoExcluir: (texto: string) => void }) {
  const [f, setF] = useState(animal ? { nome: animal.nome, especie: animal.especie as string, raca: animal.raca, sexo: animal.sexo as string, nascimento: animal.nascimento } : { nome: "", especie: "Canina", raca: "", sexo: "Fêmea", nascimento: "" });
  const [erro, setErro] = useState<ErroDeCampo>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const erroEm = (campo: string) => erro?.campo === campo;
  const texto = (chave: keyof typeof f, valor: string) => setF({ ...f, [chave]: valor });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!f.nome.trim()) return setErro({ campo: "nome", texto: "Informe o nome do animal." });
    if (!f.nascimento) return setErro({ campo: "nascimento", texto: "Informe a data de nascimento." });
    if (f.nascimento > hojeLocal()) return setErro({ campo: "nascimento", texto: "A data não pode estar no futuro." });
    setSalvando(true);
    setErro(null);
    try {
      await api(animal ? `/api/animais/${animal.id}` : `/api/tutores/${tutorId}/animais`, { metodo: animal ? "PUT" : "POST", corpo: f });
      aoSalvar(animal ? "Dados do animal atualizados." : `${f.nome.trim()} foi cadastrado e vinculado ao tutor.`);
    } catch (falha) {
      setErro({ campo: falha instanceof ErroApi ? falha.campo : undefined, texto: mensagemDe(falha) });
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!animal) return;
    setSalvando(true);
    try {
      await api(`/api/animais/${animal.id}`, { metodo: "DELETE" });
      aoExcluir(`O cadastro de ${animal.nome} foi excluído.`);
    } catch (falha) {
      setErro({ texto: mensagemDe(falha) });
      setSalvando(false);
    }
  }

  const nome = (
    <div className="field">
      <label className="lbl" htmlFor="an">
        Nome do animal
      </label>
      <input className="inp" id="an" autoComplete="off" value={f.nome} aria-invalid={erroEm("nome") || undefined} onChange={(e) => texto("nome", e.target.value)} />
      {erroEm("nome") && <span className="alert s">{erro!.texto}</span>}
    </div>
  );
  const especie = (
    <div className="field">
      <label className="lbl" htmlFor="ae">
        Espécie
      </label>
      <select className="inp" id="ae" value={f.especie} onChange={(e) => texto("especie", e.target.value)}>
        <option>Canina</option>
        <option>Felina</option>
        <option>Outra</option>
      </select>
    </div>
  );
  const raca = (
    <div className="field">
      <label className="lbl" htmlFor="ar">
        Raça
      </label>
      <input className="inp" id="ar" autoComplete="off" placeholder="Ex.: Poodle, SRD" value={f.raca} onChange={(e) => texto("raca", e.target.value)} />
    </div>
  );
  const sexo = (
    <div className="field">
      <label className="lbl" htmlFor="as">
        Sexo
      </label>
      <select className="inp" id="as" value={f.sexo} onChange={(e) => texto("sexo", e.target.value)}>
        <option>Fêmea</option>
        <option>Macho</option>
      </select>
    </div>
  );
  const nascimento = (
    <div className="field">
      <label className="lbl" htmlFor="ad">
        Data de nascimento
      </label>
      <input className="inp" id="ad" type="date" max={hojeLocal()} value={f.nascimento} aria-invalid={erroEm("nascimento") || undefined} aria-describedby="ad-err" onChange={(e) => texto("nascimento", e.target.value)} />
      {erroEm("nascimento") && (
        <span id="ad-err" className="alert s">
          {erro!.texto}
        </span>
      )}
    </div>
  );
  const erroGeral = erro && !["nome", "nascimento"].includes(erro.campo ?? "") && (
    <span role="alert" className="alert" style={{ gridColumn: "1 / -1" }}>
      {erro.texto}
    </span>
  );
  const b = celular ? { fraco: "btn2", perigo: "btnd", forte: "btnD" } : { fraco: "d-btn2 s14", perigo: "d-btnd s14", forte: "d-btnD s14" };
  const exclusao =
    animal &&
    (excluindo ? (
      <div className="danger" style={{ gridColumn: "1 / -1" }}>
        <b>Excluir {animal.nome}?</b>
        <span className="small">As consultas futuras deste animal serão canceladas. O histórico fica guardado.</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={b.fraco} style={{ flex: 1 }} onClick={() => setExcluindo(false)}>
            Manter
          </button>
          <button type="button" className={b.forte} style={{ flex: 1 }} disabled={salvando} onClick={excluir}>
            Excluir
          </button>
        </div>
      </div>
    ) : (
      <button type="button" className={b.perigo} onClick={() => setExcluindo(true)}>
        Excluir animal
      </button>
    ));
  const rotulo = animal ? "Editar animal" : "Cadastrar animal";
  const salvar = salvando ? "Salvando…" : "Salvar animal";

  if (celular) {
    return (
      <form className="card stack" aria-label={rotulo} style={{ border: "2px solid #3651D9" }} noValidate onSubmit={enviar}>
        <h2 className="h2">{animal ? `Editar ${animal.nome}` : "Novo animal"}</h2>
        {nome}
        <div className="grid2">
          {especie}
          {sexo}
        </div>
        {raca}
        {nascimento}
        {erroGeral}
        <button type="submit" className="btn" disabled={salvando}>
          {salvar}
        </button>
        {exclusao}
      </form>
    );
  }

  return (
    <form aria-label={rotulo} className="d-form3" style={{ borderTop: "1px solid #DCE3EF", paddingTop: 18 }} noValidate onSubmit={enviar}>
      <div className="eyebrow t" style={{ gridColumn: "1 / -1" }}>
        REQ 05 · {animal ? `Editar ${animal.nome}` : "Novo animal"}
      </div>
      {nome}
      {especie}
      {raca}
      {sexo}
      {nascimento}
      <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 23 }}>
        <button type="submit" className="d-btn" style={{ width: "100%" }} disabled={salvando}>
          {salvar}
        </button>
      </div>
      {erroGeral}
      {exclusao}
    </form>
  );
}

// ---------- Tela ----------

// A página é remontada quando o endereço muda; a busca e a mensagem de sucesso sobrevivem aqui.
const lembrado: { busca: string; aviso: { caminho: string; texto: string } | null } = { busca: "", aviso: null };

export function Tutores() {
  const { celular, permissoes } = useCasca();
  const podeEditar = permissoes.editarCadastros;
  const router = useRouter();
  const params = useParams<{ rota?: string[] }>();
  const lido = lerRota(params.rota ?? []);
  // Quem só lê os cadastros nunca vê formulários, mesmo digitando o endereço.
  const rota = podeEditar ? lido : { ...lido, modo: "ver" as Modo, animal: null };
  const caminho = "/tutores" + (params.rota?.length ? "/" + params.rota.join("/") : "");

  const [busca, definirBusca] = useState(lembrado.busca);
  const [termo, setTermo] = useState(lembrado.busca.trim());
  /** Mensagem de sucesso, válida só para o endereço em que deve aparecer. */
  const [aviso, definirAviso] = useState(() => (lembrado.aviso?.caminho === caminho ? lembrado.aviso : (lembrado.aviso = null)));
  const setBusca = (valor: string) => {
    lembrado.busca = valor;
    definirBusca(valor);
  };
  const setAviso = (valor: typeof lembrado.aviso) => {
    lembrado.aviso = valor;
    definirAviso(valor);
  };
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTermo(busca.trim()), 250);
    return () => window.clearTimeout(t);
  }, [busca]);

  const lista = useDados<{ tutores: Tutor[] }>(`/api/tutores${termo ? `?busca=${encodeURIComponent(termo)}` : ""}`);
  const tutores = lista.dados?.tutores ?? [];
  // No desktop, /tutores abre a ficha do primeiro da lista, como no protótipo.
  const idDaFicha = rota.id ?? (celular || rota.modo === "novo" ? null : (tutores[0]?.id ?? null));
  const ficha = useDados<{ tutor: Tutor }>(idDaFicha ? `/api/tutores/${idDaFicha}` : null);
  const t = idDaFicha && ficha.dados?.tutor.id === idDaFicha ? ficha.dados.tutor : null;
  const naoEncontrado = !!rota.id && !t && !!ficha.erro;
  const msg = aviso?.caminho === caminho ? aviso.texto : "";

  function ir(destino: string, texto = "") {
    setAviso(texto ? { caminho: destino, texto } : null);
    setConfirmando(false);
    setErro("");
    router.push(destino);
  }
  const atualizar = () => Promise.all([lista.recarregar(), ficha.recarregar()]);

  async function excluirTutor(alvo: Tutor) {
    setExcluindo(true);
    try {
      const { consultasCanceladas: n } = await api<{ consultasCanceladas: number }>(`/api/tutores/${alvo.id}`, { metodo: "DELETE" });
      await lista.recarregar();
      ir("/tutores", `O cadastro de ${alvo.nome} foi excluído.${n ? ` ${n === 1 ? "1 consulta futura foi cancelada" : `${n} consultas futuras foram canceladas`}.` : ""}`);
    } catch (falha) {
      setErro(mensagemDe(falha));
    } finally {
      setExcluindo(false);
    }
  }

  const formTutor = rota.modo !== "ver" && (rota.modo === "novo" || t) && (
    <FormTutor
      key={caminho}
      tutor={rota.modo === "novo" ? null : t}
      celular={celular}
      aoCancelar={() => ir(rota.modo === "novo" ? "/tutores" : `/tutores/${t!.id}`)}
      aoSalvar={async (salvo, criado) => {
        setBusca("");
        await atualizar();
        // Tutor novo: a ficha já abre com o formulário de animal.
        if (criado) ir(`/tutores/${salvo.id}/animais/novo`, "Tutor cadastrado. Agora cadastre os animais dele abaixo.");
        else ir(`/tutores/${salvo.id}`, "Dados do tutor atualizados.");
      }}
    />
  );

  const animalEmEdicao = typeof rota.animal === "number" ? (t?.animais.find((a) => a.id === rota.animal) ?? null) : null;
  const formAnimal = t && rota.animal !== null && (rota.animal === "novo" || animalEmEdicao) && (
    <FormAnimal
      key={caminho}
      tutorId={t.id}
      animal={animalEmEdicao}
      celular={celular}
      aoSalvar={async (texto) => {
        await atualizar();
        ir(`/tutores/${t.id}`, texto);
      }}
      aoExcluir={async (texto) => {
        await atualizar();
        ir(`/tutores/${t.id}`, texto);
      }}
    />
  );
  const alternarNovoAnimal = () => t && ir(rota.animal === "novo" ? `/tutores/${t.id}` : `/tutores/${t.id}/animais/novo`);

  const confirmacao = t && confirmando && (
    <div className="danger">
      <strong>
        Excluir {t.nome} e {textoDosVinculados(t.animais.length)}?
      </strong>
      <span className={celular ? "small" : undefined}>As consultas futuras serão canceladas. O histórico já registrado fica guardado no banco de dados da clínica.</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className={celular ? "btn2" : "d-btn2 s14"} style={{ flex: "1 1 140px" }} onClick={() => setConfirmando(false)}>
          {celular ? "Manter" : "Manter cadastro"}
        </button>
        <button type="button" className={celular ? "btnD" : "d-btnD s14"} style={{ flex: "1 1 140px" }} disabled={excluindo} onClick={() => excluirTutor(t)}>
          Excluir tutor
        </button>
      </div>
    </div>
  );

  // ---------- Celular ----------
  if (celular) {
    if (formTutor) return formTutor;

    if (rota.id) {
      return (
        <>
          <TopoCelular
            titulo="Ficha do tutor"
            esquerda={
              <Link className="iconbtn" href="/tutores" aria-label="Voltar para a lista">
                <Traco d={CAMINHOS.voltar} size={24} largura={2.2} />
              </Link>
            }
          />
          <main className="page">
            {msg && (
              <div role="status" className="msg">
                {msg}
              </div>
            )}
            {erro && (
              <div role="alert" className="erro">
                {erro}
              </div>
            )}
            {naoEncontrado && <p className="vazio">Tutor não encontrado. Ele pode ter sido excluído.</p>}
            {t && (
              <>
                <div>
                  <h2 className="h1">{t.nome}</h2>
                  <span className="small muted">Cliente desde {mesAno(t.criadoEm)}</span>
                </div>
                {podeEditar && (
                  <div className="row" style={{ gap: 8 }}>
                    <Link className="btn2" href={`/tutores/${t.id}/editar`}>
                      Editar dados
                    </Link>
                    <button type="button" className="btnd" onClick={() => setConfirmando(true)}>
                      Excluir
                    </button>
                  </div>
                )}
                {confirmacao}
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
                    <button type="button" className="link" onClick={alternarNovoAnimal}>
                      {rota.animal === "novo" ? "Fechar formulário" : "+ Adicionar animal"}
                    </button>
                  )}
                </div>
                {t.animais.length === 0 && rota.animal !== "novo" && <p className="vazio">Nenhum animal cadastrado para este tutor.</p>}
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
                          <Link className="btn2 sm" href={`/tutores/${t.id}/animais/${a.id}`}>
                            Editar
                          </Link>
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
                {formAnimal}
              </>
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
            <input type="search" aria-label="Buscar tutor ou animal" placeholder="Nome, CPF, telefone ou animal" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          {msg && (
            <div role="status" className="msg">
              {msg}
            </div>
          )}
          {lista.erro && (
            <div role="alert" className="erro">
              {lista.erro}
            </div>
          )}
          {lista.dados && tutores.length === 0 ? (
            <p className="vazio">{busca ? "Nenhum tutor encontrado para esta busca." : "Nenhum tutor cadastrado ainda."}</p>
          ) : (
            <ul className="list card" style={{ padding: "4px 16px" }}>
              {tutores.map((x) => (
                <li key={x.id}>
                  <Link className="lrow" href={`/tutores/${x.id}`} style={{ textDecoration: "none" }}>
                    <span className="av" style={{ background: "#E4F1DC", color: "#2F5D1E" }}>
                      {iniciais(x.nome)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <b style={{ display: "block" }}>{x.nome}</b>
                      <span className="small muted">{descricaoDosPets(x)}</span>
                    </span>
                    <Traco d={CAMINHOS.seta} size={20} largura={2} color="#5B6782" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
        {podeEditar && (
          <Link className="fab" href="/tutores/novo" style={{ textDecoration: "none", color: "#fff" }}>
            <Traco d={CAMINHOS.mais} size={22} largura={2.4} />
            Novo tutor
          </Link>
        )}
      </>
    );
  }

  // ---------- Desktop ----------
  let painel: ReactNode;
  if (formTutor) {
    painel = formTutor;
  } else if (!t) {
    painel = (
      <section className="d-card">
        {msg && (
          <div role="status" className="msg" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}
        <p className="d-vazio">{naoEncontrado ? "Tutor não encontrado. Ele pode ter sido excluído." : lista.dados && !idDaFicha ? "Nenhum tutor para exibir. Cadastre um novo tutor." : "Carregando…"}</p>
      </section>
    );
  } else {
    painel = (
      <>
        <section aria-label="Ficha do tutor" className="d-card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {msg && (
            <div role="status" className="msg">
              {msg}
            </div>
          )}
          {erro && (
            <div role="alert" className="danger">
              {erro}
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
                <Link className="d-btn2 s14" href={`/tutores/${t.id}/editar`}>
                  Editar dados
                </Link>
                <button type="button" className="d-btnd s14" onClick={() => setConfirmando(true)}>
                  Excluir
                </button>
              </div>
            )}
          </div>
          {confirmacao}
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
              <button type="button" className="d-btn2 s14" onClick={alternarNovoAnimal}>
                {rota.animal === "novo" ? "Fechar formulário" : "+ Adicionar animal"}
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
                        <Link className="o" href={`/tutores/${t.id}/animais/${a.id}`}>
                          Editar
                        </Link>
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
          {formAnimal}
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
          <Link className="d-btn" href="/tutores/novo">
            + Novo tutor
          </Link>
        )}
      </header>

      <div className="d-cols">
        <section aria-label="Lista de tutores" className="d-card d-narrow" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="d-search">
            <Lupa />
            <input aria-label="Buscar tutor ou animal" placeholder="Nome, CPF, telefone ou animal" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          {lista.erro && (
            <div role="alert" className="danger">
              {lista.erro}
            </div>
          )}
          {lista.dados && tutores.length === 0 && <p className="d-vazio">{busca ? "Nenhum tutor encontrado para esta busca." : "Nenhum tutor cadastrado ainda."}</p>}
          <ul className="d-tlist">
            {tutores.map((x) => (
              <li key={x.id}>
                <Link className="d-trow" href={`/tutores/${x.id}`} aria-current={rota.modo !== "novo" && x.id === idDaFicha ? "page" : undefined}>
                  <span className="av">{iniciais(x.nome)}</span>
                  <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <b>{x.nome}</b>
                    <small>{descricaoDosPets(x)}</small>
                  </span>
                </Link>
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
