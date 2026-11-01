import { TIPOS, brl, dataHora } from "../util.js";

export default function IngressoConfirmado({ pedido, pagamento, abrir, fechar }) {
  const primeiro = pedido.ingressos[0];
  return (
    <>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 42, color: "#079a69" }}>✓</div>
        <span className="kicker">ETAPA 3 DE 3 · COMPRA CONFIRMADA</span>
        <h2 id="modalTitle">Seu ingresso está pronto!</h2>
        <p>Apresente o código do pedido na entrada da sala.</p>
      </div>
      <div className="ticket">
        <span className="kicker">CINEMA UNIFOR</span>
        <b>{primeiro.filme?.titulo}</b>
        <p>
          {dataHora(primeiro.sessao.data_hora)} · Sala {primeiro.sessao.sala}
        </p>
        <p>
          Assentos: <b>{pedido.ingressos.map((i) => i.assento?.rotulo).join(", ")}</b>
        </p>
        <div className="ticket-code">{pedido.codigo_pedido}</div>
        <p>
          {TIPOS[primeiro.tipo_ingresso]?.nome || primeiro.tipo_ingresso} · {pagamento}
        </p>
        <b>Total: {brl(pedido.total)}</b>
      </div>
      <div className="detail-actions">
        <button className="btn" id="verMeus" style={{ background: "var(--blue)", color: "white" }} onClick={() => abrir("meus")}>
          Ver meus ingressos
        </button>
        <button className="btn btn-outline" onClick={fechar}>
          Concluir
        </button>
      </div>
    </>
  );
}
