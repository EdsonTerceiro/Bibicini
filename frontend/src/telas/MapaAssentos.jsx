import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Carregando } from "../components/Modal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { MAX_ASSENTOS, brl, dataHora } from "../util.js";

export default function MapaAssentos({ filme, sessao, abrir }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const [mapa, setMapa] = useState(null);
  const [erro, setErro] = useState("");
  const [selecionados, setSelecionados] = useState([]); // [{ id, rotulo }]

  useEffect(() => {
    api(`/sessoes/${sessao._id}/assentos`).then(setMapa).catch((e) => setErro(e.message));
  }, [sessao._id]);

  if (erro)
    return (
      <>
        <h2 id="modalTitle">Mapa indisponível</h2>
        <p>{erro}</p>
      </>
    );
  if (!mapa) return <Carregando texto="Carregando mapa da sala…" />;

  const colunas = Math.max(1, ...mapa.assentos.map((a) => a.numero));
  const livres = mapa.assentos.filter((a) => !a.ocupado).length;
  const marcado = (id) => selecionados.some((s) => s.id === id);

  function alternar(a) {
    if (marcado(a._id)) setSelecionados(selecionados.filter((s) => s.id !== a._id));
    else if (selecionados.length < MAX_ASSENTOS) setSelecionados([...selecionados, { id: a._id, rotulo: a.rotulo }]);
    else toast(`Limite de ${MAX_ASSENTOS} assentos por pedido.`);
  }

  function continuar() {
    const pedido = { filme, sessao, mapa, selecionados };
    if (usuario) abrir("checkout", pedido);
    else abrir("login", { mensagem: "Entre ou crie sua conta para finalizar a compra.", depois: { tela: "checkout", props: pedido } });
  }

  return (
    <>
      <span className="kicker">ETAPA 1 DE 3 · ESCOLHA SEU LUGAR</span>
      <h2 id="modalTitle">Selecione seus assentos</h2>
      <p>
        {filme.titulo} · {dataHora(sessao.data_hora)} · Sala {mapa.sala.numero} · {livres} lugares livres
      </p>
      <div className="seat-layout">
        <div>
          <div className="screen-label">TELA</div>
          <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}>
            {mapa.assentos.map((a) => (
              <button
                key={a._id}
                className={`seat${a.ocupado ? " occupied" : ""}${marcado(a._id) ? " selected" : ""}`}
                style={{ gridColumn: a.numero }}
                disabled={a.ocupado}
                data-rotulo={a.rotulo}
                aria-pressed={a.ocupado ? undefined : marcado(a._id)}
                aria-label={`Assento ${a.rotulo}${a.ocupado ? " ocupado" : ""}`}
                onClick={() => alternar(a)}
              >
                {a.rotulo}
              </button>
            ))}
          </div>
          <div className="legend">
            <span><i></i>Disponível</span>
            <span><i className="leg-selected"></i>Selecionado</span>
            <span><i className="leg-taken"></i>Ocupado</span>
          </div>
        </div>
        <aside className="seat-summary">
          <h3>Seu pedido</h3>
          <p id="seatNames">{selecionados.map((s) => s.rotulo).join(", ") || "Nenhum assento selecionado"}</p>
          <p>Inteira {brl(mapa.sessao.preco)} por lugar</p>
          <div className="total" id="seatTotal">
            {brl(selecionados.length * mapa.sessao.preco)}
          </div>
          <button
            className="btn"
            id="continueSeats"
            style={{ background: "var(--blue)", color: "white", width: "100%", marginTop: 14 }}
            disabled={!selecionados.length}
            onClick={continuar}
          >
            Continuar →
          </button>
        </aside>
      </div>
      <p className="modal-note">
        Máximo de {MAX_ASSENTOS} assentos por pedido. Os lugares só ficam garantidos depois de confirmar a compra.
      </p>
    </>
  );
}
