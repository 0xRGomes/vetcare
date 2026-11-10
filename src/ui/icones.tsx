// Ícones do protótipo, desenhados em SVG.

type Props = { size?: number; className?: string; color?: string };

export function Pata({ size = 26, className, color = "#3651D9" }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 120 120" width={size} height={size} fill={color}>
      <ellipse cx="60" cy="80" rx="26" ry="22" />
      <ellipse cx="30" cy="48" rx="11" ry="14" />
      <ellipse cx="50" cy="30" rx="11" ry="15" />
      <ellipse cx="72" cy="30" rx="11" ry="15" />
      <ellipse cx="91" cy="48" rx="11" ry="14" />
    </svg>
  );
}

export function Cruz({ size = 22 }: Props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="#FFFFFF">
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
    </svg>
  );
}

/** Ícone de traço a partir de um path (menu lateral e barra de abas). */
export function Traco({ d, size = 20, largura = 1.9, color = "currentColor" }: Props & { d: string; largura?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export const CAMINHOS = {
  inicio: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  agenda: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  novo: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M12 13v5M9.5 15.5h5",
  tutores: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M18 15c2 .5 3 2.5 3 5",
  usuarios: "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM9 12l2 2 4-4",
  chave: "M15 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM12 12v9M12 17h3M12 20h2",
  sair: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  mais: "M12 5v14M5 12h14",
  voltar: "M15 5l-7 7 7 7",
  fechar: "M6 6l12 12M18 6L6 18",
  seta: "M9 6l6 6-6 6",
  certo: "M5 12l5 5L20 7",
  alerta: "M12 3l10 18H2zM12 10v5M12 18v.5",
} as const;

export function Lupa({ size = 18 }: Props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#5B6782" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function Cadeado() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2B3FB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
