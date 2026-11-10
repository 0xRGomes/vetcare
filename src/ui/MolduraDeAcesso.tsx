"use client";

// Moldura das telas fora do menu (entrar e definir senha): marca à esquerda no desktop, no topo no celular.

import type { ReactNode } from "react";
import { Pata } from "./icones";
import { useEhCelular } from "./useEhCelular";

export function MolduraDeAcesso({ children }: { children: (celular: boolean) => ReactNode }) {
  const celular = useEhCelular();
  if (celular === null) return null;

  if (celular) {
    return (
      <div className="m">
        <div className="m-app">
          <div className="login">
            <div className="lhero">
              <i className="b1" />
              <i className="b2" />
              <i className="b3" />
              <i className="b4" />
              <Pata className="paw" color="#FFFFFF" />
              <div className="lbrand">
                <div className="eyebrow" style={{ color: "#FFFFFF" }}>
                  Gestão veterinária
                </div>
                <div className="logo">VETCARE</div>
              </div>
            </div>
            <div className="page" style={{ paddingBottom: 32, gap: 20 }}>
              {children(true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg">
      <div className="lg-hero">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
        <Pata color="#FFFFFF" />
        <div className="lg-brand">
          <div className="tag">Sistema de gestão veterinária</div>
          <div className="logo">VETCARE</div>
          <div className="desc">Tutores, animais, agenda, prontuários e pagamentos em um só lugar.</div>
        </div>
      </div>
      <div className="lg-side">
        <div className="lg-box">{children(false)}</div>
      </div>
    </div>
  );
}
