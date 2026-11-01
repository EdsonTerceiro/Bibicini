import QrCode from "../components/QrCode.jsx";
import { TIPOS, brl, dataHora, linkValidacao } from "../util.js";

export default function IngressoConfirmado({ pedido, pagamento, abrir, fechar }) {
  const primeiro = pedido.ingressos[0];
  return (
    <>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 42, color: "#079a69" }}>✓</div>
        <span className="kicker">ETAPA 3 DE 3 · COMPRA CONFIRMADA</span>
        <h2 id="modalTitle">Seu ingresso está pronto!</h2>
        <p>Apresente o QR Code na entrada da sala.</p>
      </div>
      <div className="ticket ticket-com-qr">
        <div>
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
        <div className="qr-box">
          <QrCode texto={linkValidacao(pedido.codigo_pedido)} rotulo={`QR Code do pedido ${pedido.codigo_pedido}`} />
          <small>Válido para {pedido.ingressos.length === 1 ? "1 pessoa" : `${pedido.ingressos.length} pessoas`}</small>
        </div>
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
