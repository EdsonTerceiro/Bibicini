import { useCallback, useEffect, useState } from "react";

// Carrega dados da API e permite recarregar depois de criar/editar/excluir
export function useDados(carregar) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const recarregar = useCallback(() => {
    carregar()
      .then((d) => {
        setDados(d);
        setErro("");
      })
      .catch((e) => setErro(e.message));
  }, [carregar]);
  useEffect(recarregar, [recarregar]);
  return { dados, erro, recarregar };
}

export const BotaoPequeno = ({ perigo, children, ...props }) => (
  <button type="button" className={`btn btn-outline btn-pequeno${perigo ? " btn-perigo" : ""}`} {...props}>
    {children}
  </button>
);

export const BotaoAzul = ({ children, ...props }) => (
  <button className="btn btn-azul" {...props}>
    {children}
  </button>
);

export function Bloco({ titulo, children, acao }) {
  return (
    <div className="admin-bloco">
      {(titulo || acao) && (
        <div className="admin-bloco-topo">
          {titulo && <h3>{titulo}</h3>}
          {acao}
        </div>
      )}
      {children}
    </div>
  );
}

export function EstadoCarregamento({ erro }) {
  return (
    <div className="empty-state">
      <b>{erro ? "Erro" : "Carregando…"}</b>
      {erro}
    </div>
  );
}

// "2026-11-05T22:00:00.000Z" -> "2026-11-05T19:00" (formato do <input type="datetime-local">)
export function paraInputData(iso) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export const confirmar = (texto) => window.confirm(texto);
