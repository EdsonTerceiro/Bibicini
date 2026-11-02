import { useCallback, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { PUBLICOS, STATUS, TIPOS, brl, dataHora, valorOuGratis } from "../util.js";
import { Bloco, BotaoPequeno, EstadoCarregamento, confirmar, useDados } from "./comum.jsx";

export default function AdminVendas({ pedidoInicial }) {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [pedido, setPedido] = useState(pedidoInicial || ""); // pedido lido pelo QR Code
  const carregar = useCallback(() => {
    const q = new URLSearchParams({ limite: 100 });
    if (status) q.set("status", status);
    if (pedido) q.set("codigo", pedido);
    return api("/ingressos?" + q);
  }, [status, pedido]);
  const { dados, erro, recarregar } = useDados(carregar);
  const [busca, setBusca] = useState("");

  if (!dados) return <EstadoCarregamento erro={erro} />;

  // filtra pelo código do pedido ou nome/e-mail do cliente (validação na entrada da sala)
  const termo = busca.trim().toLowerCase();
  const lista = dados.itens.filter(
    (i) =>
      !termo ||
      i.codigo_pedido.toLowerCase().includes(termo) ||
      i.usuario?.nome?.toLowerCase().includes(termo) ||
      i.usuario?.email?.toLowerCase().includes(termo),
  );
  const receita = lista.filter((i) => ["pago", "utilizado"].includes(i.status)).reduce((a, i) => a + i.valor_pago, 0);

  const pagos = lista.filter((i) => i.status === "pago");

  // entrada pelo QR Code: valida todos os ingressos ainda não usados do pedido
  async function validarTodos() {
    if (!confirmar(`Validar a entrada de ${pagos.length} ingresso(s) do pedido ${pedido}?`)) return;
    let ok = 0;
    for (const i of pagos) {
      try {
        await api(`/ingressos/${i.id}/utilizar`, { method: "POST" });
        ok++;
      } catch (err) {
        toast(err.message);
      }
    }
    toast(`${ok} entrada(s) validada(s).`);
    recarregar();
  }

  function verTodas() {
    setPedido("");
    window.history.replaceState({}, "", "/admin");
  }

  async function acao(i, tipo) {
    const textos = {
      utilizar: ["Validar a entrada deste ingresso?", "Entrada validada."],
      cancelar: ["Cancelar este ingresso? O assento será liberado.", "Ingresso cancelado."],
    };
    if (!confirmar(`${textos[tipo][0]}\n${i.codigo_pedido} · assento ${i.assento?.rotulo}`)) return;
    try {
      await api(`/ingressos/${i.id}/${tipo}`, { method: "POST" });
      toast(textos[tipo][1]);
      recarregar();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <Bloco titulo={`Vendas (${lista.length} de ${dados.total} ingressos) · ${brl(receita)}`}>
      {pedido && (
        <div className="admin-aviso" id="avisoPedido">
          <span>
            {dados.total ? (
              <>
                Pedido <b>{pedido}</b> lido pelo QR Code · {pagos.length} ingresso(s) para validar
              </>
            ) : (
              <>
                Pedido <b>{pedido}</b> não encontrado.
              </>
            )}
          </span>
          <span className="admin-acoes">
            {pagos.length > 0 && (
              <button className="btn btn-azul btn-pequeno" id="validarTodos" onClick={validarTodos}>
                Validar todos ({pagos.length})
              </button>
            )}
            <BotaoPequeno onClick={verTodas}>Ver todas as vendas</BotaoPequeno>
          </span>
        </div>
      )}
      <div className="form-stack admin-form">
        <label className="admin-largo">
          Buscar pelo código do pedido ou cliente
          <input
            id="buscaVenda"
            type="search"
            placeholder="Ex.: UNF-1A2B3C4D"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="tabela-rolavel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Filme / sessão</th>
              <th>Assento</th>
              <th>Público</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => {
              const futuro = i.sessao && new Date(i.sessao.data_hora) > new Date();
              return (
                <tr key={i.id}>
                  <td>{i.codigo_pedido}</td>
                  <td>
                    {i.usuario?.nome}
                    <br />
                    <small>{i.usuario?.email}</small>
                  </td>
                  <td>
                    {i.filme?.titulo}
                    <br />
                    <small>{i.sessao && `${dataHora(i.sessao.data_hora)} · Sala ${i.sessao.sala}`}</small>
                  </td>
                  <td>{i.assento?.rotulo}</td>
                  <td>{PUBLICOS[i.publico]?.replace("Público ", "") || "—"}</td>
                  <td>{TIPOS[i.tipo_ingresso]?.nome.split(" (")[0] || i.tipo_ingresso}</td>
                  <td>{valorOuGratis(i.valor_pago)}</td>
                  <td>
                    <span className={`status-demo status-${i.status}`}>{STATUS[i.status] || i.status}</span>
                  </td>
                  <td>
                    <div className="admin-acoes">
                    {i.status === "pago" && (
                      <BotaoPequeno data-validar={i.id} onClick={() => acao(i, "utilizar")}>
                        Validar entrada
                      </BotaoPequeno>
                    )}
                    {futuro && ["pago", "reservado"].includes(i.status) && (
                      <BotaoPequeno perigo data-cancelar-venda={i.id} onClick={() => acao(i, "cancelar")}>
                        Cancelar
                      </BotaoPequeno>
                    )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!lista.length && (
              <tr>
                <td colSpan={9}>Nenhum ingresso encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Bloco>
  );
}
