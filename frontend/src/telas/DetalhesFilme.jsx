import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Carregando } from "../components/Modal.jsx";
import { Poster } from "../components/FilmeCard.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { brl, classif, dia, hora } from "../util.js";

const btnAzul = { background: "var(--blue)", color: "white" };

export default function DetalhesFilme({ id, abrir }) {
  const toast = useToast();
  const [filme, setFilme] = useState(null);
  const [sessoes, setSessoes] = useState(null);
  const [erro, setErro] = useState("");
  const [erroSessoes, setErroSessoes] = useState("");

  useEffect(() => {
    api("/filmes/" + id).then(setFilme).catch((e) => setErro(e.message));
    api("/sessoes?id_filme=" + id).then(setSessoes).catch((e) => setErroSessoes(e.message));
  }, [id]);

  async function abrirTrailer() {
    try {
      let videos = [];
      for (const lang of ["pt-BR", "en-US"]) {
        const d = await api(`/tmdb/movie/${filme.tmdb_id}?language=${lang}&append_to_response=videos`);
        videos = d.videos?.results || [];
        if (videos.length) break;
      }
      const v =
        videos.find((x) => x.site === "YouTube" && x.type === "Trailer") || videos.find((x) => x.site === "YouTube");
      if (v) window.open("https://www.youtube.com/watch?v=" + encodeURIComponent(v.key), "_blank", "noopener");
      else toast("Trailer não disponível para este filme.");
    } catch (e) {
      toast(e.status === 503 ? "O servidor não tem chave do TMDB configurada." : e.message);
    }
  }

  if (erro)
    return (
      <>
        <h2 id="modalTitle">Filme indisponível</h2>
        <p>{erro}</p>
      </>
    );
  if (!filme) return <Carregando />;

  // agrupa as sessões por dia: { "Hoje": [...], "Amanhã": [...] }
  const porDia = {};
  (sessoes || []).forEach((s) => (porDia[dia(s.data_hora)] ||= []).push(s));

  return (
    <>
      <div className="detail-layout">
        <div>
          <Poster caminho={filme.poster_path} titulo={filme.titulo} className="detail-poster" />
        </div>
        <div>
          <span className="kicker">CINEMA UNIFOR · EM CARTAZ</span>
          <h2 id="modalTitle">{filme.titulo}</h2>
          <div className="detail-meta">
            <span className="pill">Classificação: {classif(filme.classificacao)}</span>
            <span className="pill">{filme.duracao_min} min</span>
            <span className="pill">{filme.id_genero?.nome || "Cinema"}</span>
          </div>
          <p>{filme.sinopse || "Sinopse não disponível para este título."}</p>
          {filme.tmdb_id && (
            <div className="detail-actions">
              <button className="btn btn-outline" onClick={abrirTrailer}>
                Ver trailer ↗
              </button>
            </div>
          )}
        </div>
      </div>

      <div id="sessionsArea">
        {erroSessoes ? (
          <div className="empty-state">
            <b>Erro ao buscar sessões</b>
            {erroSessoes}
          </div>
        ) : !sessoes ? (
          <Carregando texto="Buscando sessões…" />
        ) : !sessoes.length ? (
          <>
            <h2 style={{ fontSize: 18, marginTop: 25 }}>Sessões</h2>
            <div className="empty-state">
              <b>Sem sessões programadas</b>Volte em breve para conferir novos horários.
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, marginTop: 25 }}>Escolha sua sessão</h2>
            {Object.entries(porDia).map(([d, lista]) => (
              <div key={d}>
                <h3 className="dia-sessoes">{d}</h3>
                <div className="session-list">
                  {lista.map((s) => (
                    <div className="session-option" key={s._id}>
                      <div>
                        <b>
                          {hora(s.data_hora)} · Sala {s.id_sala?.numero ?? "?"}
                        </b>
                        <small>
                          Inteira {brl(s.preco)} · Meia {brl(s.preco / 2)}
                        </small>
                      </div>
                      <button className="btn" style={btnAzul} data-sessao={s._id} onClick={() => abrir("assentos", { filme, sessao: s })}>
                        Selecionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
