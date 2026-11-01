import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { Carregando } from "../components/Modal.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { STATUS, TIPOS, brl, dataHora } from "../util.js";

export default function MeusIngressos() {
  const toast = useToast();
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(() => {
    api("/ingressos/meus").then(setLista).catch((e) => setErro(e.message));
  }, []);
  useEffect(carregar, [carregar]);

  async function cancelar(id) {
    if (!window.confirm("Cancelar este ingresso? O assento será liberado.")) return;
    try {
      await api(`/ingressos/${id}/cancelar`, { method: "POST" });
      toast("Ingresso cancelado.");
      carregar();
    } catch (e) {
      toast(e.message);
    }
  }

  if (erro)
    return (
      <>
        <h2 id="modalTitle">Meus ingressos</h2>
        <p>{erro}</p>
      </>
    );
  if (!lista) return <Carregando texto="Buscando seus ingressos…" />;

  // um pedido pode ter vários ingressos (um por assento)
  const pedidos = {};
  lista.forEach((i) => (pedidos[i.codigo_pedido] ||= []).push(i));

  return (
    <>
      <span className="kicker">MINHA CONTA</span>
      <h2 id="modalTitle">Meus ingressos</h2>
      {!lista.length && (
        <div className="empty-state">
          <b>Você ainda não tem ingressos</b>Escolha um filme em cartaz para começar.
        </div>
      )}
      {Object.entries(pedidos).map(([codigo, ings]) => {
        const p = ings[0];
        const futuro = p.sessao && new Date(p.sessao.data_hora) > new Date();
        return (
          <div className="ticket" key={codigo}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <b>{p.filme?.titulo || "Filme removido"}</b>
              <span className="pill">{codigo}</span>
            </div>
            <p>{p.sessao && `${dataHora(p.sessao.data_hora)} · Sala ${p.sessao.sala}`}</p>
            <table className="admin-table">
              <tbody>
                {ings.map((i) => (
                  <tr key={i.id}>
                    <td>
                      Assento <b>{i.assento?.rotulo || "?"}</b>
                    </td>
                    <td>{TIPOS[i.tipo_ingresso]?.nome.split(" (")[0] || i.tipo_ingresso}</td>
                    <td>{brl(i.valor_pago)}</td>
                    <td>
                      <span className={`status-demo status-${i.status}`}>{STATUS[i.status] || i.status}</span>
                    </td>
                    <td>
                      {futuro && ["pago", "reservado"].includes(i.status) && (
                        <button
                          className="btn btn-outline btn-pequeno"
                          data-cancelar={i.id}
                          onClick={() => cancelar(i.id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
