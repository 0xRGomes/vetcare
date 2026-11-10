import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="nf">
      <div className="nf-cod">404</div>
      <h1>Página não encontrada</h1>
      <p>O endereço não existe ou você não tem acesso a ele.</p>
      <Link href="/">Voltar ao sistema</Link>
    </main>
  );
}
