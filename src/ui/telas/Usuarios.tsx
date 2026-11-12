"use client";

// REQ 01 — Manter usuário (somente Administrador)
//
//   /usuarios          lista, permissões por perfil e trilha de auditoria
//   /usuarios/novo     novo usuário
//   /usuarios/:id      editar usuário

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, mensagemDe } from "../api";
import { TopoCelular, useCasca } from "../Casca";
import { CAMINHOS, Lupa, Traco } from "../icones";
import { iniciais } from "../status";
import type { Perfil, Usuario, UsuarioService } from "../tipos";
import { useDados } from "../useDados";

type Painel = ReturnType<UsuarioService["painel"]>;
type Nivel = Painel["matriz"][number]["niveis"][Perfil];

const PERFIS: { id: Perfil; nome: string; curto: string; desc: string; cor: [string, string] }[] = [
  { id: "ADMINISTRADOR", nome: "Administrador", curto: "Admin.", desc: "usuários e gestão", cor: ["#0B3A8F", "#FFFFFF"] },
  { id: "RECEPCIONISTA", nome: "Recepcionista", curto: "Recepção", desc: "cadastros e agenda", cor: ["#E1F3FE", "#075985"] },
  { id: "VETERINARIO", nome: "Veterinário", curto: "Veterinário", desc: "própria agenda e consulta aos cadastros", cor: ["#E4F1DC", "#2F5D1E"] },
];
const perfilDe = (id: Perfil) => PERFIS.find((p) => p.id === id)!;
const corDoPerfil = (id: Perfil) => ({ background: perfilDe(id).cor[0], color: perfilDe(id).cor[1] });
const COR_DO_STATUS = { Ativo: "#2F5D1E", Bloqueado: "#9B1C1C", Inativo: "#5B6782" };

const NIVEIS: Record<Nivel, { t: string; background: string; color: string }> = {
  total: { t: "Total", background: "#0B3A8F", color: "#FFFFFF" },
  leitura: { t: "Leitura", background: "#E1F3FE", color: "#075985" },
  "propria-agenda": { t: "Própria agenda", background: "#E1F3FE", color: "#075985" },
  "sem-acesso": { t: "Sem acesso", background: "#F1F3F7", color: "#5B6782" },
};

const dois = (n: number) => String(n).padStart(2, "0");

/** "Hoje, 09:30", "Ontem, 18:02" ou "02/10/2026". */
function quando(iso: string | null, agora: string, separador = ", "): string {
  if (!iso) return "Nunca acessou";
  const d = new Date(iso);
  const hoje = new Date(agora);
  const dias = Math.round((new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  if (dias === 0) return `Hoje${separador}${hora}`;
  if (dias === 1) return `Ontem${separador}${hora}`;
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}${separador === ", " ? "" : separador + hora}`;
}

interface Resultado {
  destino: string;
  texto: string;
  senha?: { nome: string; valor: string };
}

function FormUsuario({ usuario, euMesmo, celular, aoConcluir, aoCancelar }: { usuario: Usuario | null; euMesmo: boolean; celular: boolean; aoConcluir: (r: Resultado) => void; aoCancelar: () => void }) {
  const novo = usuario === null;
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? "RECEPCIONISTA");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const titulo = novo ? "Novo usuário" : "Editar usuário";
  const perfisDoFormulario = usuario?.perfil === "VETERINARIO"
    ? PERFIS.filter((p) => p.id === "VETERINARIO")
    : PERFIS.filter((p) => p.id !== "VETERINARIO");

  async function executar(acao: () => Promise<Resultado>) {
    setOcupado(true);
    setErro("");
    try {
      aoConcluir(await acao());
    } catch (falha) {
      setErro(mensagemDe(falha));
      setOcupado(false);
    }
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return setErro("Preencha nome e e-mail para cadastrar.");
    const corpo = { nome, email, perfil };
    void executar(async () => {
      if (!novo) {
        await api(`/api/usuarios/${usuario.id}`, { metodo: "PUT", corpo });
        return { destino: `/usuarios/${usuario.id}`, texto: "Alterações salvas." };
      }
      const r = await api<{ usuario: Usuario; senhaProvisoria: string }>("/api/usuarios", { metodo: "POST", corpo });
      return { destino: `/usuarios/${r.usuario.id}`, texto: "Usuário cadastrado.", senha: { nome: r.usuario.nome, valor: r.senhaProvisoria } };
    });
  }

  const ativar = (ativo: boolean) =>
    executar(async () => {
      await api(`/api/usuarios/${usuario!.id}/ativo`, { metodo: "PUT", corpo: { ativo } });
      return { destino: `/usuarios/${usuario!.id}`, texto: ativo ? "Acesso reativado." : "Acesso excluído. O histórico foi mantido." };
    });

  const novaSenha = () =>
    executar(async () => {
      const r = await api<{ usuario: Usuario; senhaProvisoria: string }>(`/api/usuarios/${usuario!.id}/senha`, { metodo: "POST" });
      return { destino: `/usuarios/${usuario!.id}`, texto: "Nova senha provisória gerada.", senha: { nome: r.usuario.nome, valor: r.senhaProvisoria } };
    });

  const campos = (
    <>
      <div className="field">
        <label className="lbl" htmlFor="un">
          Nome completo
        </label>
        <input className="inp" id="un" autoComplete="off" placeholder="Ex.: Joana Ribeiro" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="ue">
          E-mail de acesso
        </label>
        <input className="inp" id="ue" type="email" inputMode="email" autoComplete="off" placeholder="nome@clinica.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <legend className="lbl" style={{ marginBottom: 6, padding: 0 }}>
          Perfil de acesso
        </legend>
        {perfisDoFormulario.map((p) => (
          <button key={p.id} type="button" className={celular ? "opt perfil" : "d-perfil"} aria-pressed={p.id === perfil} disabled={euMesmo && p.id !== perfil} onClick={() => setPerfil(p.id)}>
            <i />
            <span>
              <strong>{p.nome}</strong> · {p.desc}
            </span>
          </button>
        ))}
      </fieldset>
      {novo && (
        <span className="small muted">
          Contas veterinárias e suas agendas são criadas junto com o cadastro do profissional na tela Veterinários.
        </span>
      )}
      {usuario?.perfil === "VETERINARIO" && (
        <span className="small muted">
          O perfil e a agenda são gerenciados em Veterinários.{" "}
          <Link href="/veterinarios" className="link" style={{ color: "var(--royal)", textDecoration: "underline" }}>Abrir cadastros</Link>
        </span>
      )}
      {euMesmo && <span className="small muted">Este é o seu usuário: o perfil e o acesso não podem ser alterados por você mesmo.</span>}
      {erro && (
        <span role="alert" className="alert">
          {erro}
        </span>
      )}
      {novo && <span className="small muted">O sistema gera uma senha provisória e a mostra a você uma única vez. Informe-a ao usuário: no primeiro acesso ele define a própria senha.</span>}
    </>
  );

  const b = celular ? { forte: "btn", fraco: "btn2", perigo: "btnd", perigoso: "btnD" } : { forte: "d-btn", fraco: "d-btn2", perigo: "d-btnd", perigoso: "d-btnD" };
  const acoesDoUsuario = !novo && !euMesmo && (
    <>
      {usuario.status !== "Inativo" && (
        <button type="button" className={b.fraco} style={{ flex: "1 1 100%" }} disabled={ocupado} onClick={novaSenha}>
          Gerar nova senha provisória
        </button>
      )}
      {usuario.status === "Inativo" ? (
        <button type="button" className={b.fraco} style={{ flex: "1 1 120px" }} disabled={ocupado} onClick={() => ativar(true)}>
          Reativar acesso
        </button>
      ) : (
        !confirmando && (
          <button type="button" className={b.perigo} style={{ flex: "1 1 120px" }} onClick={() => setConfirmando(true)}>
            Excluir acesso
          </button>
        )
      )}
      {confirmando && (
        <div className="danger" style={{ flex: "1 1 100%" }}>
          <strong>Excluir o acesso de {usuario.nome}?</strong>
          <span className="small">O usuário não consegue mais entrar. Os registros feitos por ele continuam no histórico.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={b.fraco} style={{ flex: 1 }} onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className={b.perigoso} style={{ flex: 1 }} disabled={ocupado} onClick={() => ativar(false)}>
              Excluir acesso
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (celular) {
    return (
      <>
        <form id="form-usuario" className="stack" aria-label={titulo} noValidate onSubmit={salvar}>
          {campos}
        </form>
        {acoesDoUsuario && (
          <div className="stack" style={{ gap: 10, paddingTop: 16, borderTop: "1px solid #DCE3EF" }}>
            {acoesDoUsuario}
          </div>
        )}
        <div className="ctabar">
          <button type="submit" form="form-usuario" className="btn" disabled={ocupado}>
            {novo ? "Cadastrar usuário" : "Salvar alterações"}
          </button>
        </div>
      </>
    );
  }

  return (
    <form aria-label={titulo} noValidate onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {campos}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="submit" className="d-btn" style={{ flex: "1 1 120px" }} disabled={ocupado}>
          {novo ? "Cadastrar usuário" : "Salvar alterações"}
        </button>
        {novo && (
          <button type="button" className="d-btn2" style={{ flex: "1 1 120px" }} onClick={aoCancelar}>
            Cancelar
          </button>
        )}
        {acoesDoUsuario}
      </div>
    </form>
  );
}

// A página é remontada quando o endereço muda; a mensagem de sucesso (com a senha provisória) sobrevive aqui.
let avisoLembrado: Resultado | null = null;

export function Usuarios() {
  const { celular, sessao } = useCasca();
  const router = useRouter();
  const params = useParams<{ rota?: string[] }>();
  const [parte] = params.rota ?? [];
  const novo = parte === "novo";
  const id = parte && !novo ? Number(parte) : null;
  const caminho = "/usuarios" + (parte ? "/" + parte : "");

  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  // Vale só para a tela seguinte à ação: ao sair dela, a mensagem (e a senha) é descartada.
  const [aviso, definirAviso] = useState(() => (avisoLembrado?.destino === caminho ? avisoLembrado : (avisoLembrado = null)));
  const setAviso = (valor: Resultado | null) => {
    avisoLembrado = valor;
    definirAviso(valor);
  };
  const [aba, setAba] = useState<Perfil>("ADMINISTRADOR");

  useEffect(() => {
    const t = window.setTimeout(() => setTermo(busca.trim()), 250);
    return () => window.clearTimeout(t);
  }, [busca]);

  const dados = useDados<Painel>(`/api/usuarios${termo ? `?busca=${encodeURIComponent(termo)}` : ""}`);
  const p = dados.dados;
  const usuario = id && p ? (p.usuarios.find((u) => u.id === id) ?? null) : null;
  const msg = aviso?.destino === caminho ? aviso : null;

  async function concluir(r: Resultado) {
    setBusca("");
    setTermo("");
    await dados.recarregar();
    setAviso(r);
    router.push(r.destino);
  }
  const fechar = () => {
    setAviso(null);
    router.push("/usuarios");
  };

  const avisos = msg && (
    <>
      <div role="status" className="msg">
        {msg.texto}
      </div>
      {msg.senha && (
        <div className="senha-provisoria" role="status">
          <span>Senha provisória de {msg.senha.nome}</span>
          <code>{msg.senha.valor}</code>
          <small>Anote e informe ao usuário agora: ela não será exibida de novo. No primeiro acesso ele define a própria senha.</small>
        </div>
      )}
    </>
  );

  const formulario = p && (novo || usuario) && (
    <FormUsuario key={caminho + (usuario?.status ?? "")} usuario={novo ? null : usuario} euMesmo={usuario?.id === sessao.usuarioId} celular={celular} aoConcluir={concluir} aoCancelar={fechar} />
  );
  const naoEncontrado = !!id && !!p && !usuario;

  // ---------- Celular ----------
  if (celular) {
    if (novo || id) {
      return (
        <>
          <TopoCelular
            titulo={novo ? "Novo usuário" : "Editar usuário"}
            esquerda={
              <Link className="iconbtn" href="/usuarios" aria-label="Voltar para a lista">
                <Traco d={CAMINHOS.voltar} size={24} largura={2.2} />
              </Link>
            }
          />
          <main className="page withcta">
            {avisos}
            {naoEncontrado && <p className="vazio">Usuário não encontrado.</p>}
            {formulario}
          </main>
        </>
      );
    }
    return (
      <>
        <TopoCelular titulo="Usuários e perfis" />
        <main className="page">
          <div className="eyebrow">REQ 01 · Manter usuário</div>
          <label className="search">
            <Lupa size={20} />
            <input type="search" aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          {dados.erro && (
            <div role="alert" className="erro">
              {dados.erro}
            </div>
          )}
          {p && (
            <>
              {p.usuarios.length === 0 ? (
                <p className="vazio">Nenhum usuário encontrado.</p>
              ) : (
                <ul className="list card" style={{ padding: "4px 16px" }}>
                  {p.usuarios.map((u) => (
                    <li key={u.id}>
                      <Link className="lrow" href={`/usuarios/${u.id}`} style={{ textDecoration: "none" }}>
                        <span className="av" style={corDoPerfil(u.perfil)}>
                          {iniciais(u.nome)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <b style={{ display: "block" }}>{u.nome}</b>
                          <span className="small muted">{perfilDe(u.perfil).nome} · </span>
                          <span className="small" style={{ fontWeight: 700, color: COR_DO_STATUS[u.status] }}>
                            {u.status}
                          </span>
                        </span>
                        <Traco d={CAMINHOS.seta} size={20} largura={2} color="#5B6782" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <section className="card stack" aria-label="Permissões por perfil">
                <div>
                  <h2 className="h2">Permissões por perfil (RBAC)</h2>
                  <span className="small muted">Toda nova função declara o acesso de cada perfil.</span>
                </div>
                <div className="seg" role="group" aria-label="Perfil">
                  {PERFIS.map((x) => (
                    <button key={x.id} type="button" aria-pressed={aba === x.id} onClick={() => setAba(x.id)}>
                      {x.curto}
                    </button>
                  ))}
                </div>
                <ul className="list">
                  {p.matriz.map((m) => (
                    <li key={m.modulo} className="li" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{m.modulo}</span>
                      <span className="pill" style={NIVEIS[m.niveis[aba]]}>
                        {NIVEIS[m.niveis[aba]].t}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="card navy stack" aria-label="Trilha de auditoria" style={{ gap: 0 }}>
                <h2 className="h2" style={{ color: "#FFFFFF", marginBottom: 6 }}>
                  Trilha de auditoria
                </h2>
                {p.auditoria.length === 0 && <span style={{ color: "#C8D6FF" }}>Nenhum evento registrado ainda.</span>}
                {p.auditoria.map((e) => (
                  <div key={e.id} className="vrow" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <b>{e.descricao}</b>
                    <span className="mono small" style={{ color: "#C8D6FF" }}>
                      {quando(e.quando, p.agora, " · ")}
                    </span>
                  </div>
                ))}
              </section>
            </>
          )}
        </main>
        <Link className="fab" href="/usuarios/novo" style={{ textDecoration: "none", color: "#fff" }}>
          <Traco d={CAMINHOS.mais} size={22} largura={2.4} />
          Novo usuário
        </Link>
      </>
    );
  }

  // ---------- Desktop ----------
  const tituloDoPainel = novo ? "Novo usuário" : id ? "Editar usuário" : "Usuário";
  return (
    <>
      <header className="d-head">
        <div>
          <div className="eyebrow">REQ 01 · Manter usuário</div>
          <h1>Usuários e perfis</h1>
          <p className="sub">Inclua, altere, desative e consulte quem acessa o sistema e com qual perfil.</p>
        </div>
        <div className="d-actions">
          <label className="d-search" style={{ width: 260 }}>
            <Lupa />
            <input aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <Link className="d-btn" href="/usuarios/novo">
            + Novo usuário
          </Link>
        </div>
      </header>

      {dados.erro && (
        <div role="alert" className="danger">
          {dados.erro}
        </div>
      )}

      {p && (
        <>
          <div className="d-cols">
            <section aria-label="Lista de usuários" className="d-card" style={{ flex: "999 1 520px", minWidth: 0, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="d-tabela" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Perfil</th>
                      <th>Status</th>
                      <th>Último acesso</th>
                      <th aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {p.usuarios.map((u) => (
                      <tr key={u.id} style={{ background: u.id === id ? "#EEF2FF" : "#FFFFFF" }}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{u.nome}</div>
                          <div style={{ fontSize: 13, color: "#5B6782" }}>{u.email}</div>
                        </td>
                        <td>
                          <span className="pill" style={corDoPerfil(u.perfil)}>
                            {perfilDe(u.perfil).nome}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: COR_DO_STATUS[u.status] }}>
                          {u.status}
                          {u.senhaProvisoria && u.status !== "Inativo" && <div style={{ fontSize: 13, fontWeight: 400, color: "#5B6782" }}>Senha provisória</div>}
                        </td>
                        <td style={{ color: "#5B6782" }}>{quando(u.ultimoAcesso, p.agora)}</td>
                        <td style={{ textAlign: "right", paddingTop: 8, paddingBottom: 8 }}>
                          <Link className="d-btn2 s14" style={{ height: 40, padding: "0 14px", borderRadius: 8 }} href={`/usuarios/${u.id}`}>
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {p.usuarios.length === 0 && <p className="d-vazio">Nenhum usuário encontrado.</p>}
            </section>

            <aside aria-label={tituloDoPainel} className="d-card" style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16, border: novo ? "2px solid #3651D9" : undefined }}>
              <div className="eyebrow t">{tituloDoPainel}</div>
              {avisos}
              {formulario}
              {naoEncontrado && <p className="muted" style={{ margin: 0 }}>Usuário não encontrado.</p>}
              {!novo && !id && (
                <p className="muted" style={{ margin: 0 }}>
                  Clique em <strong>Editar</strong> na lista para alterar um usuário, ou em <strong>+ Novo usuário</strong> para dar acesso a alguém.
                </p>
              )}
            </aside>
          </div>

          <div className="d-cols">
            <section aria-label="Permissões por perfil" className="d-card" style={{ flex: "999 1 520px", minWidth: 0 }}>
              <h2 className="h2">Permissões por perfil (RBAC)</h2>
              <p style={{ margin: "4px 0 16px", fontSize: 14, color: "#5B6782" }}>Toda nova funcionalidade precisa declarar seu nível de acesso para cada perfil.</p>
              <div style={{ overflowX: "auto" }}>
                <table className="d-matriz" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      {PERFIS.map((x) => (
                        <th key={x.id}>{x.nome}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.matriz.map((m) => (
                      <tr key={m.modulo}>
                        <td style={{ fontWeight: 700 }}>{m.modulo}</td>
                        {PERFIS.map((x) => (
                          <td key={x.id}>
                            <span style={NIVEIS[m.niveis[x.id]]}>{NIVEIS[m.niveis[x.id]].t}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-label="Trilha de auditoria" className="d-navy" style={{ flex: "1 1 320px", minWidth: 0, gap: 14 }}>
              <h2 style={{ fontSize: 22 }}>Trilha de auditoria</h2>
              {p.auditoria.length === 0 && <span style={{ color: "#C8D6FF" }}>Nenhum evento registrado ainda. Aqui aparecem as alterações de usuários e os bloqueios de login.</span>}
              <ul className="d-audit">
                {p.auditoria.map((e) => (
                  <li key={e.id}>
                    <span>{e.descricao}</span>
                    <small>{quando(e.quando, p.agora, " · ")}</small>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
