import { useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { Bloco, BotaoAzul, BotaoPequeno, confirmar } from "./comum.jsx";

// Gêneros dos filmes (Ação, Drama…): criar, renomear e excluir
export default function AdminGeneros({ generos, filmes, onMudou }) {
  const toast = useToast();
  const [nome, setNome] = useState("");

  const emUso = (g) => filmes.filter((f) => f.id_genero?._id === g._id).length;

  async function criar(e) {
    e.preventDefault();
    try {
      await api("/generos", { method: "POST", body: { nome: nome.trim() } });
      toast(`Gênero "${nome.trim()}" criado.`);
      setNome("");
      onMudou();
    } catch (err) {
      toast(err.status === 409 ? "Esse gênero já existe." : err.message);
    }
  }

  async function renomear(g) {
    const novo = window.prompt("Novo nome do gênero:", g.nome)?.trim();
    if (!novo || novo === g.nome) return;
    try {
      await api("/generos/" + g._id, { method: "PUT", body: { nome: novo } });
      toast("Gênero renomeado.");
      onMudou();
    } catch (err) {
      toast(err.status === 409 ? "Esse gênero já existe." : err.message);
    }
  }

  async function excluir(g) {
    if (!confirmar(`Excluir o gênero "${g.nome}"?`)) return;
    try {
      await api("/generos/" + g._id, { method: "DELETE" });
      toast("Gênero excluído.");
      onMudou();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <Bloco titulo={`Gêneros (${generos.length})`}>
      <form className="form-stack admin-form" id="generoForm" onSubmit={criar}>
        <label>
          Novo gênero
          <input required maxLength={50} placeholder="Ex.: Documentário" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="admin-acoes">
          <BotaoAzul>Criar gênero</BotaoAzul>
        </div>
      </form>
      <div className="genero-lista">
        {generos.map((g) => (
          <div className="genero-item" key={g._id}>
            <span>
              {g.nome} <small>({emUso(g)})</small>
            </span>
            <BotaoPequeno data-renomear-genero={g._id} onClick={() => renomear(g)}>
              Renomear
            </BotaoPequeno>
            <BotaoPequeno perigo data-excluir-genero={g._id} onClick={() => excluir(g)}>
              Excluir
            </BotaoPequeno>
          </div>
        ))}
      </div>
    </Bloco>
  );
}
