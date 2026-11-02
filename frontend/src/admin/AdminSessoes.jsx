import { useCallback, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { MODOS, PUBLICOS, dataHora, textoRegra } from "../util.js";
import { Bloco, BotaoAzul, BotaoPequeno, EstadoCarregamento, confirmar, paraInputData, useDados } from "./comum.jsx";

// padrão de uma sessão nova: comunidade não paga, externo paga R$ 16
const PADRAO = { comunidade: { modo: "gratuito", preco: "" }, externo: { modo: "pago", preco: 16 } };

// Para um público: Gratuito / Pago (com valor) / Não disponível
function RegraPublico({ publico, regra, onChange }) {
  return (
    <fieldset className="regra-publico" data-publico={publico}>
      <legend>{PUBLICOS[publico]}</legend>
      <div className="regra-opcoes" role="radiogroup">
        {Object.entries(MODOS).map(([modo, nome]) => (
          <label key={modo} className={`regra-opcao${regra.modo === modo ? " ativa" : ""}`}>
            <input
              type="radio"
              name={`modo-${publico}`}
              value={modo}
              checked={regra.modo === modo}
              onChange={() => onChange({ ...regra, modo })}
            />
            {nome}
          </label>
        ))}
      </div>
      {regra.modo === "pago" && (
        <label>
          Valor da inteira (R$) — meia-entrada: 50%
          <input
            required
            type="number"
            min="0.5"
            step="0.5"
            name={`preco-${publico}`}
            value={regra.preco}
            onChange={(e) => onChange({ ...regra, preco: e.target.value })}
          />
        </label>
      )}
    </fieldset>
  );
}

function SessaoForm({ inicial, filmes, salas, onSalvo, onCancelar }) {
  const toast = useToast();
  const editando = !!inicial?._id;
  const [form, setForm] = useState(() => ({
    id_filme: inicial?.id_filme?._id || filmes[0]?._id || "",
    id_sala: inicial?.id_sala?._id || salas[0]?._id || "",
    data_hora: inicial?.data_hora ? paraInputData(inicial.data_hora) : "",
  }));
  const [publicos, setPublicos] = useState(() => ({
    comunidade: { ...PADRAO.comunidade, ...inicial?.publicos?.comunidade },
    externo: { ...PADRAO.externo, ...inicial?.publicos?.externo },
  }));
  const regra = (p) => ({ ...publicos[p], preco: publicos[p].modo === "pago" ? publicos[p].preco : 0 });
  const [enviando, setEnviando] = useState(false);
  const campo = (nome) => ({ name: nome, value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api(editando ? `/sessoes/${inicial._id}` : "/sessoes", {
        method: editando ? "PUT" : "POST",
        body: {
          ...form,
          data_hora: new Date(form.data_hora).toISOString(),
          publicos: { comunidade: regra("comunidade"), externo: regra("externo") },
        },
      });
      toast(editando ? "Sessão atualizada." : "Sessão criada.");
      onSalvo();
    } catch (err) {
      toast(err.message); // ex.: conflito de horário com outra sessão da sala
      setEnviando(false);
    }
  }

  return (
    <form className="form-stack admin-form" id="sessaoForm" onSubmit={salvar}>
      <p className="admin-dica admin-largo">
        Sessões de segunda a sábado, a partir das 13:00. A sala fica ocupada durante o filme + 15 min de intervalo, então
        duas sessões não podem se cruzar na mesma sala.
      </p>
      <label className="admin-largo">
        Filme
        <select required {...campo("id_filme")}>
          {filmes.map((f) => (
            <option key={f._id} value={f._id}>
              {f.titulo}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sala
        <select required {...campo("id_sala")}>
          {salas.map((s) => (
            <option key={s._id} value={s._id}>
              Sala {s.nome} ({s.total_assentos} lugares)
            </option>
          ))}
        </select>
      </label>
      <label>
        Data e hora
        <input required type="datetime-local" {...campo("data_hora")} />
      </label>
      <div className="admin-largo regras-publicos">
        {Object.keys(PUBLICOS).map((p) => (
          <RegraPublico key={p} publico={p} regra={publicos[p]} onChange={(r) => setPublicos({ ...publicos, [p]: r })} />
        ))}
      </div>
      <div className="admin-acoes admin-largo">
        <BotaoAzul disabled={enviando}>{editando ? "Salvar alterações" : "Criar sessão"}</BotaoAzul>
        <button type="button" className="btn btn-outline" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminSessoes() {
  const toast = useToast();
  const carregar = useCallback(
    () =>
      Promise.all([api("/sessoes?todas=1"), api("/filmes?limite=50"), api("/salas")]).then(([sessoes, f, salas]) => ({
        sessoes,
        filmes: f.itens,
        salas,
      })),
    [],
  );
  const { dados, erro, recarregar } = useDados(carregar);
  const [formulario, setFormulario] = useState(null);
  const [verPassadas, setVerPassadas] = useState(false);

  if (!dados) return <EstadoCarregamento erro={erro} />;

  const agora = new Date();
  const lista = dados.sessoes.filter((s) => verPassadas || new Date(s.data_hora) >= agora);

  async function excluir(s) {
    if (!confirmar(`Excluir a sessão de "${s.id_filme?.titulo}" (${dataHora(s.data_hora)})?`)) return;
    try {
      await api("/sessoes/" + s._id, { method: "DELETE" });
      toast("Sessão excluída.");
      recarregar();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <>
      {formulario && (
        <Bloco titulo={formulario._id ? "Editar sessão" : "Nova sessão"}>
          <SessaoForm
            key={formulario._id || "nova"}
            inicial={formulario}
            filmes={dados.filmes}
            salas={dados.salas}
            onSalvo={() => {
              setFormulario(null);
              recarregar();
            }}
            onCancelar={() => setFormulario(null)}
          />
        </Bloco>
      )}
      <Bloco
        titulo={`Sessões (${lista.length})`}
        acao={
          <div className="admin-acoes">
            <label className="admin-check">
              <input type="checkbox" checked={verPassadas} onChange={(e) => setVerPassadas(e.target.checked)} /> Mostrar passadas
            </label>
            {!formulario && (
              <BotaoAzul type="button" id="novaSessao" onClick={() => setFormulario({})}>
                + Nova sessão
              </BotaoAzul>
            )}
          </div>
        }
      >
        <div className="tabela-rolavel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Filme</th>
                <th>Sala</th>
                <th>Acesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s._id}>
                  <td>{dataHora(s.data_hora)}</td>
                  <td>{s.id_filme?.titulo || "Filme removido"}</td>
                  <td>Sala {s.id_sala?.nome}</td>
                  <td>
                    <div className="acesso-celula">
                      {Object.entries(PUBLICOS).map(([p, nome]) => (
                        <span key={p} className={`acesso acesso-${s.publicos?.[p]?.modo}`}>
                          {nome.replace("Público ", "")}: {textoRegra(s.publicos?.[p])}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="admin-acoes">
                    <BotaoPequeno data-editar-sessao={s._id} onClick={() => setFormulario(s)}>
                      Editar
                    </BotaoPequeno>
                    <BotaoPequeno perigo data-excluir-sessao={s._id} onClick={() => excluir(s)}>
                      Excluir
                    </BotaoPequeno>
                    </div>
                  </td>
                </tr>
              ))}
              {!lista.length && (
                <tr>
                  <td colSpan={5}>Nenhuma sessão.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Bloco>
    </>
  );
}
