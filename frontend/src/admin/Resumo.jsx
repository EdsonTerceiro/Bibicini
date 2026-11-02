import { useCallback } from "react";
import { api } from "../api.js";
import { brl } from "../util.js";
import { EstadoCarregamento, useDados } from "./comum.jsx";

export default function Resumo() {
  const { dados: r, erro } = useDados(useCallback(() => api("/admin/resumo"), []));
  if (!r) return <EstadoCarregamento erro={erro} />;
  const s = r.ingressos_por_status || {};
  const itens = [
    ["Receita (confirmados + utilizados)", brl(r.receita)],
    ["Ingressos confirmados", s.pago || 0],
    ["Ingressos utilizados", s.utilizado || 0],
    ["Ingressos cancelados", s.cancelado || 0],
    ["Sessões futuras", r.sessoes_futuras],
    ["Filmes cadastrados", r.filmes],
    ["Salas", r.salas],
    ["Usuários", r.usuarios],
  ];
  return (
    <div className="admin-stat-grid">
      {itens.map(([rotulo, valor]) => (
        <div className="admin-stat" key={rotulo}>
          <small>{rotulo}</small>
          <b>{valor}</b>
        </div>
      ))}
    </div>
  );
}
