import { useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { TIPOS, brl, dataHora } from "../util.js";

export default function Checkout({ filme, sessao, mapa, selecionados, abrir, pedirLogin }) {
  const toast = useToast();
  const [tipo, setTipo] = useState("inteira");
  const [pagamento, setPagamento] = useState("PIX (simulado)");
  const [enviando, setEnviando] = useState(false);

  // prévia do valor (o valor cobrado é sempre calculado pelo servidor)
  const unitario = Math.round(mapa.sessao.preco * TIPOS[tipo].fator * 100) / 100;
  const total = unitario * selecionados.length;

  async function confirmar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const pedido = await api("/ingressos", {
        method: "POST",
        body: {
          id_sessao: sessao._id,
          assentos: selecionados.map((s) => s.id),
          tipo_ingresso: tipo,
        },
      });
      abrir("ingresso", { pedido, pagamento });
    } catch (err) {
      toast(err.message);
      setEnviando(false);
      // alguém comprou o mesmo lugar antes: volta ao mapa atualizado
      if (err.status === 409) abrir("assentos", { filme, sessao });
      else if (err.status === 401)
        pedirLogin({ mensagem: "Sua sessão expirou. Entre novamente para concluir a compra.", tela: "checkout", props: { filme, sessao, mapa, selecionados } });
    }
  }

  return (
    <>
      <span className="kicker">ETAPA 2 DE 3 · REVISÃO DO PEDIDO</span>
      <h2 id="modalTitle">Quase na hora do filme.</h2>
      <p>Confira os detalhes antes de confirmar.</p>
      <div className="ticket">
        <b>{filme.titulo}</b>
        <p>
          {dataHora(sessao.data_hora)} · Sala {mapa.sala.nome}
        </p>
        <p>
          Assentos: <b>{selecionados.map((s) => s.rotulo).join(", ")}</b>
        </p>
        <p>
          {selecionados.length} × {brl(unitario)} ({TIPOS[tipo].nome})
        </p>
        <div className="ticket-code" id="totalPedido">
          {brl(total)}
        </div>
      </div>
      <form className="form-stack" id="checkoutForm" onSubmit={confirmar}>
        <label>
          Tipo de ingresso
          <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(TIPOS).map(([k, t]) => (
              <option key={k} value={k}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Forma de pagamento
          <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option>PIX (simulado)</option>
            <option>Cartão de crédito (simulado)</option>
          </select>
        </label>
        <button className="btn" id="confirmarCompra" style={{ background: "var(--blue)", color: "white" }} disabled={enviando}>
          {enviando ? "Processando…" : "Confirmar compra →"}
        </button>
      </form>
      <p className="modal-note">
        Pagamento simulado para fins acadêmicos: nenhum valor é cobrado. O preço final é calculado pelo servidor.
      </p>
    </>
  );
}
