import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { PUBLICOS, TIPOS, brl, dataHora, publicoDe, valorIngresso, valorOuGratis } from "../util.js";

export default function Checkout({ filme, sessao, mapa, selecionados, abrir, pedirLogin }) {
  const toast = useToast();
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState("inteira");
  const [pagamento, setPagamento] = useState("PIX (simulado)");
  const [enviando, setEnviando] = useState(false);

  // a regra que vale para esta pessoa depende do e-mail da conta (Comunidade UNIFOR x Público externo)
  const publico = publicoDe(usuario);
  const regra = mapa.sessao.publicos?.[publico];
  const pago = regra?.modo === "pago";
  const fechado = !regra || regra.modo === "fechado";
  // prévia do valor (o valor cobrado é sempre calculado pelo servidor)
  const unitario = valorIngresso(regra, tipo);
  const total = unitario * selecionados.length;
  const rotulos = selecionados.map((s) => s.rotulo).join(", ");

  async function confirmar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const pedido = await api("/ingressos", {
        method: "POST",
        body: {
          id_sessao: sessao._id,
          assentos: selecionados.map((s) => s.id),
          ...(pago ? { tipo_ingresso: tipo } : {}),
        },
      });
      abrir("ingresso", { pedido, pagamento: pago ? pagamento : null });
    } catch (err) {
      toast(err.message);
      setEnviando(false);
      // alguém pegou o mesmo lugar antes: volta ao mapa atualizado
      if (err.status === 409) abrir("assentos", { filme, sessao });
      else if (err.status === 401)
        pedirLogin({ mensagem: "Sua sessão expirou. Entre novamente para concluir a compra.", tela: "checkout", props: { filme, sessao, mapa, selecionados } });
    }
  }

  const resumo = (
    <div className="ticket">
      <b>{filme.titulo}</b>
      <p>
        {dataHora(sessao.data_hora)} · Sala {mapa.sala.nome}
      </p>
      <p>
        Assentos: <b>{rotulos}</b>
      </p>
      {!fechado && (
        <>
          <p>
            {PUBLICOS[publico]} ·{" "}
            {pago ? `${selecionados.length} × ${brl(unitario)} (${TIPOS[tipo].nome})` : `${selecionados.length} ingresso(s) gratuito(s)`}
          </p>
          <div className="ticket-code" id="totalPedido">
            {valorOuGratis(total)}
          </div>
        </>
      )}
    </div>
  );

  // sessão exclusiva para o outro público
  if (fechado)
    return (
      <>
        <span className="kicker">ETAPA 2 DE 3 · REVISÃO</span>
        <h2 id="modalTitle">Sessão exclusiva</h2>
        {resumo}
        <p className="auth-aviso" id="avisoExclusiva">
          Esta sessão é exclusiva para: <b>{PUBLICOS[publico === "comunidade" ? "externo" : "comunidade"]}</b>. Sua conta (
          {usuario?.email}) é do {PUBLICOS[publico]}.
        </p>
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={() => abrir("filme", { id: filme._id })}>
            Ver outras sessões
          </button>
        </div>
      </>
    );

  return (
    <>
      <span className="kicker">ETAPA 2 DE 3 · {pago ? "REVISÃO DO PEDIDO" : "RESERVA"}</span>
      <h2 id="modalTitle">Quase na hora do filme.</h2>
      <p>{pago ? "Confira os detalhes antes de confirmar." : "Esta sessão é gratuita para você: é só confirmar a reserva dos lugares."}</p>
      {resumo}
      <form className="form-stack" id="checkoutForm" onSubmit={confirmar}>
        {pago && (
          <>
            <label>
              Tipo de ingresso
              <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="inteira">{TIPOS.inteira.nome}</option>
                <option value="meia">{TIPOS.meia.nome}</option>
              </select>
            </label>
            <label>
              Forma de pagamento
              <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                <option>PIX (simulado)</option>
                <option>Cartão de crédito (simulado)</option>
              </select>
            </label>
          </>
        )}
        <button className="btn" id="confirmarCompra" style={{ background: "var(--blue)", color: "white" }} disabled={enviando}>
          {enviando ? "Processando…" : pago ? "Confirmar compra →" : "Confirmar reserva →"}
        </button>
      </form>
      <p className="modal-note">
        {pago
          ? "Pagamento simulado para fins acadêmicos: nenhum valor é cobrado. O preço final é calculado pelo servidor."
          : "Ingresso gratuito: apresente o QR Code na entrada. Se não puder ir, cancele em \"Meus ingressos\" para liberar o lugar."}
      </p>
    </>
  );
}
