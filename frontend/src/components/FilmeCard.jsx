import { useState } from "react";
import { classif, posterUrl } from "../util.js";

export function Poster({ caminho, titulo, className = "" }) {
  const [falhou, setFalhou] = useState(false);
  if (!caminho || falhou) return <div className={`poster-placeholder ${className}`.trim()}>UNIFOR</div>;
  return (
    <img
      className={className || undefined}
      loading="lazy"
      src={posterUrl(caminho)}
      alt={`Cartaz de ${titulo}`}
      onError={() => setFalhou(true)}
    />
  );
}

export default function FilmeCard({ filme, onAbrir }) {
  const abrir = () => onAbrir(filme._id);
  return (
    <article
      className="movie-card"
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes e sessões de ${filme.titulo}`}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      }}
    >
      <div className="poster-wrap">
        <Poster caminho={filme.poster_path} titulo={filme.titulo} />
        <span className="rating" title="Classificação indicativa">
          {classif(filme.classificacao)}
        </span>
        <span className="movie-type">EM CARTAZ</span>
      </div>
      <h3 className="movie-title">{filme.titulo}</h3>
      <div className="movie-meta">
        <span>{filme.id_genero?.nome || "Cinema"}</span>
        <span>{filme.duracao_min} min</span>
      </div>
      <div className="movie-cta">
        <span>Ver detalhes e sessões</span>
        <span>↗</span>
      </div>
    </article>
  );
}
