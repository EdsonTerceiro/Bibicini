import { useEffect, useRef } from "react";

export default function Modal({ aberto, onFechar, chave, children }) {
  const fecharRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    const tecla = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, onFechar]);

  // ao trocar de tela, volta o foco para o topo do modal
  useEffect(() => {
    if (aberto) fecharRef.current?.focus();
  }, [chave, aberto]);

  if (!aberto) return null;
  return (
    <div className="modal-backdrop" id="modalBackdrop" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button className="modal-close" id="modalClose" aria-label="Fechar" ref={fecharRef} onClick={onFechar}>
          ×
        </button>
        <div id="modalContent">{children}</div>
      </section>
    </div>
  );
}

export const Carregando = ({ texto = "Carregando…" }) => (
  <div className="empty-state" style={{ padding: "40px 10px" }}>
    <b>{texto}</b>
  </div>
);
