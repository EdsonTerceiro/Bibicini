import { useCallback, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";
import { classif } from "../util.js";
import { Bloco, BotaoAzul, BotaoPequeno, EstadoCarregamento, confirmar, useDados } from "./comum.jsx";
import AdminGeneros from "./AdminGeneros.jsx";

const CLASSIFICACOES = ["Livre", "10", "12", "14", "16", "18"];
const VAZIO = { titulo: "", duracao_min: "", classificacao: "Livre", id_genero: "", sinopse: "", tmdb_id: "" };

// Formulário usado para cadastrar e para editar
function FilmeForm({ inicial, generos, onSalvo, onCancelar }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({ ...VAZIO, id_genero: generos[0]?._id || "", ...inicial }));
  const [enviando, setEnviando] = useState(false);
  const editando = !!inicial?._id;
  const campo = (nome) => ({ name: nome, value: form[nome] ?? "", onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });

  async function salvar(e) {
    e.preventDefault();
    const corpo = {
      titulo: form.titulo,
      duracao_min: Number(form.duracao_min),
      classificacao: form.classificacao,
      id_genero: form.id_genero,
      sinopse: form.sinopse || undefined,
      tmdb_id: form.tmdb_id ? Number(form.tmdb_id) : undefined,
    };
    setEnviando(true);
    try {
      await api(editando ? `/filmes/${inicial._id}` : "/filmes", { method: editando ? "PUT" : "POST", body: corpo });
      toast(editando ? "Filme atualizado." : "Filme cadastrado.");
      onSalvo();
    } catch (err) {
      toast(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="form-stack admin-form" id="filmeForm" onSubmit={salvar}>
      <label className="admin-largo">
        Título
        <input required maxLength={150} {...campo("titulo")} />
      </label>
      <label>
        Duração (min)
        <input required type="number" min={1} {...campo("duracao_min")} />
      </label>
      <label>
        Classificação
        <select {...campo("classificacao")}>
          {CLASSIFICACOES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Gênero
        <select required {...campo("id_genero")}>
          {generos.map((g) => (
            <option key={g._id} value={g._id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        ID no TMDB (opcional)
        <input type="number" min={1} placeholder="Ex.: 155" {...campo("tmdb_id")} />
      </label>
      <label className="admin-largo">
        Sinopse (opcional)
        <textarea rows={3} maxLength={2000} {...campo("sinopse")} />
      </label>
      <div className="admin-acoes admin-largo">
        <BotaoAzul disabled={enviando}>{editando ? "Salvar alterações" : "Cadastrar filme"}</BotaoAzul>
        <button type="button" className="btn btn-outline" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminFilmes() {
  const toast = useToast();
  const carregar = useCallback(
    () => Promise.all([api("/filmes?limite=50"), api("/generos")]).then(([f, g]) => ({ filmes: f.itens, total: f.total, generos: g })),
    [],
  );
  const { dados, erro, recarregar } = useDados(carregar);
  const [formulario, setFormulario] = useState(null); // null | {} (novo) | filme (editar)
  const [tmdbId, setTmdbId] = useState("");
  const [importando, setImportando] = useState(false);

  if (!dados) return <EstadoCarregamento erro={erro} />;

  async function importar(e) {
    e.preventDefault();
    setImportando(true);
    try {
      const f = await api("/filmes/importar-tmdb", { method: "POST", body: { tmdb_id: Number(tmdbId) } });
      toast(`"${f.titulo}" importado do TMDB.`);
      setTmdbId("");
      recarregar();
    } catch (err) {
      toast(err.status === 503 ? "O servidor não tem TMDB_API_KEY configurada." : err.message);
    }
    setImportando(false);
  }

  async function excluir(f) {
    if (!confirmar(`Excluir "${f.titulo}"?`)) return;
    try {
      await api("/filmes/" + f._id, { method: "DELETE" });
      toast("Filme excluído.");
      recarregar();
    } catch (err) {
      toast(err.message);
    }
  }

  const fecharForm = () => setFormulario(null);
  const salvo = () => {
    setFormulario(null);
    recarregar();
  };

  return (
    <>
      <Bloco titulo="Importar do TMDB">
        <p className="admin-dica">
          Cole o número do filme no endereço do TMDB (ex.: themoviedb.org/movie/<b>155</b>-the-dark-knight). Título, duração,
          gênero, classificação, cartaz e sinopse são preenchidos automaticamente.
        </p>
        <form className="form-stack admin-form" id="importForm" onSubmit={importar}>
          <label>
            ID do filme no TMDB
            <input required type="number" min={1} value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} placeholder="Ex.: 155" />
          </label>
          <div className="admin-acoes">
            <BotaoAzul disabled={importando}>{importando ? "Importando…" : "Importar"}</BotaoAzul>
          </div>
        </form>
      </Bloco>

      {formulario && (
        <Bloco titulo={formulario._id ? `Editar: ${formulario.titulo}` : "Novo filme"}>
          <FilmeForm key={formulario._id || "novo"} inicial={formulario} generos={dados.generos} onSalvo={salvo} onCancelar={fecharForm} />
        </Bloco>
      )}

      <Bloco
        titulo={`Filmes cadastrados (${dados.total})`}
        acao={
          !formulario && (
            <BotaoAzul type="button" id="novoFilme" onClick={() => setFormulario({})}>
              + Cadastrar manualmente
            </BotaoAzul>
          )
        }
      >
        <div className="tabela-rolavel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Filme</th>
                <th>Gênero</th>
                <th>Duração</th>
                <th>Classif.</th>
                <th>TMDB</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dados.filmes.map((f) => (
                <tr key={f._id}>
                  <td>{f.titulo}</td>
                  <td>{f.id_genero?.nome}</td>
                  <td>{f.duracao_min} min</td>
                  <td>{classif(f.classificacao)}</td>
                  <td>{f.tmdb_id || "—"}</td>
                  <td className="admin-acoes">
                    <BotaoPequeno
                      data-editar-filme={f._id}
                      onClick={() => setFormulario({ ...f, id_genero: f.id_genero?._id, tmdb_id: f.tmdb_id ?? "", sinopse: f.sinopse ?? "" })}
                    >
                      Editar
                    </BotaoPequeno>
                    <BotaoPequeno perigo data-excluir-filme={f._id} onClick={() => excluir(f)}>
                      Excluir
                    </BotaoPequeno>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>

      <AdminGeneros generos={dados.generos} filmes={dados.filmes} onMudou={recarregar} />
    </>
  );
}
