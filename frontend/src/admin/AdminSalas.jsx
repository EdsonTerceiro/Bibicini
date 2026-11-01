import { useCallback, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { Bloco, BotaoAzul, BotaoPequeno, EstadoCarregamento, confirmar, useDados } from "./comum.jsx";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function AdminSalas() {
  const toast = useToast();
  const { dados: salas, erro, recarregar } = useDados(useCallback(() => api("/salas"), []));
  const [form, setForm] = useState({ nome: "", fileiras: 5, por_fileira: 8 });
  const [enviando, setEnviando] = useState(false);

  if (!salas) return <EstadoCarregamento erro={erro} />;

  const total = Number(form.fileiras) * Number(form.por_fileira) || 0;
  const campo = (nome) => ({ name: nome, value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });
  // sugere a próxima letra livre (A, B, C…)
  const proxima = [...LETRAS].find((l) => !salas.some((s) => s.nome === l)) || "";

  async function criar(e) {
    e.preventDefault();
    const nome = (form.nome || proxima).trim().toUpperCase();
    setEnviando(true);
    try {
      await api("/salas", {
        method: "POST",
        body: {
          nome,
          fileiras: LETRAS.slice(0, Number(form.fileiras)).split(""),
          assentos_por_fileira: Number(form.por_fileira),
        },
      });
      toast(`Sala ${nome} criada com ${total} assentos.`);
      setForm({ ...form, nome: "" });
      recarregar();
    } catch (err) {
      toast(err.status === 409 ? `Já existe a sala ${nome}.` : err.message);
    }
    setEnviando(false);
  }

  async function renomear(s) {
    const nova = window.prompt(`Nova letra para a sala ${s.nome}:`, s.nome)?.trim().toUpperCase();
    if (!nova || nova === s.nome) return;
    try {
      await api("/salas/" + s._id, { method: "PUT", body: { nome: nova } });
      toast(`Sala ${s.nome} agora é a sala ${nova}.`);
      recarregar();
    } catch (err) {
      toast(err.status === 409 ? `Já existe a sala ${nova}.` : err.message);
    }
  }

  async function excluir(s) {
    if (!confirmar(`Excluir a sala ${s.nome}?`)) return;
    try {
      await api("/salas/" + s._id, { method: "DELETE" });
      toast("Sala excluída.");
      recarregar();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <>
      <Bloco titulo="Nova sala">
        <form className="form-stack admin-form" id="salaForm" onSubmit={criar}>
          <label>
            Letra da sala
            <input
              name="nome"
              maxLength={1}
              pattern="[A-Za-z]"
              title="Uma letra de A a Z"
              placeholder={proxima ? `Ex.: ${proxima}` : "Letra"}
              style={{ textTransform: "uppercase" }}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </label>
          <label>
            Fileiras de assentos (A, B, C…)
            <input required type="number" min={1} max={26} {...campo("fileiras")} />
          </label>
          <label>
            Assentos por fileira
            <input required type="number" min={1} max={50} {...campo("por_fileira")} />
          </label>
          <div className="admin-acoes">
            <BotaoAzul disabled={enviando}>Criar sala ({total} lugares)</BotaoAzul>
          </div>
        </form>
      </Bloco>
      <Bloco titulo={`Salas (${salas.length})`}>
        <div className="tabela-rolavel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sala</th>
                <th>Capacidade</th>
                <th>Assentos cadastrados</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salas.map((s) => (
                <tr key={s._id}>
                  <td>Sala {s.nome}</td>
                  <td>{s.capacidade}</td>
                  <td>{s.total_assentos}</td>
                  <td className="admin-acoes">
                    <BotaoPequeno data-renomear-sala={s._id} onClick={() => renomear(s)}>
                      Renomear
                    </BotaoPequeno>
                    <BotaoPequeno perigo data-excluir-sala={s._id} onClick={() => excluir(s)}>
                      Excluir
                    </BotaoPequeno>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>
    </>
  );
}
