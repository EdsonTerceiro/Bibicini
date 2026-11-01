import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { IconeBusca } from "./Header.jsx";
import FilmeCard from "./FilmeCard.jsx";
import { Link } from "../rota.jsx";

// modo "destaque" (página inicial): uma linha de filmes + botão "Ver todos os filmes"
// modo "completo" (página /filmes): todos os filmes, com "Carregar mais"
const POR_PAGINA = { destaque: 4, completo: 12 };

export default function Catalogo({ onAbrirFilme, modo = "destaque" }) {
  const completo = modo === "completo";
  const [generos, setGeneros] = useState([]);
  const [texto, setTexto] = useState(""); // o que está digitado
  const [busca, setBusca] = useState(""); // o que foi enviado ao servidor (300 ms depois de parar de digitar)
  const [genero, setGenero] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState({ filmes: [], total: 0, paginas: 1 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const buscaRef = useRef(null);

  // gêneros para o filtro
  useEffect(() => {
    api("/generos").then(setGeneros).catch(() => {});
  }, []);

  // atalho "/" foca a busca
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  // espera o usuário parar de digitar
  useEffect(() => {
    const novo = texto.trim();
    if (novo === busca) return; // nada mudou: não volta para a página 1
    const t = setTimeout(() => {
      setBusca(novo);
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [texto, busca]);

  // busca os filmes sempre que filtro ou página mudam
  useEffect(() => {
    let ativo = true; // ignora respostas antigas
    const q = new URLSearchParams({ pagina, limite: POR_PAGINA[modo] });
    if (busca) q.set("busca", busca);
    if (genero) q.set("genero", genero);
    setCarregando(true);
    api("/filmes?" + q)
      .then((d) => {
        if (!ativo) return;
        setErro("");
        setDados((antes) => ({
          filmes: pagina === 1 ? d.itens : [...antes.filmes, ...d.itens],
          total: d.total,
          paginas: d.paginas || 1,
        }));
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [busca, genero, pagina, modo]);

  const { filmes, total, paginas } = dados;
  const primeiraCarga = carregando && pagina === 1;

  let conteudo;
  if (primeiraCarga) {
    conteudo = [1, 2, 3, 4].map((i) => <div key={i} className="loading-card"></div>);
  } else if (erro && !filmes.length) {
    conteudo = (
      <div className="empty-state">
        <b>Não foi possível carregar os filmes</b>
        {erro}
      </div>
    );
  } else if (!filmes.length) {
    conteudo = (
      <div className="empty-state">
        <b>Nenhum filme encontrado</b>Tente outro título ou remova os filtros.
      </div>
    );
  } else {
    conteudo = filmes.map((f) => <FilmeCard key={f._id} filme={f} onAbrir={onAbrirFilme} />);
  }

  return (
    <section className="content-section" id={completo ? "catalogo" : "filmes"}>
      {completo && (
        <nav className="breadcrumb" aria-label="Você está em">
          <Link to="/">Início</Link> <span>/</span> Filmes
        </nav>
      )}
      <div className="section-heading">
        <div>
          <span className="kicker">{completo ? "CATÁLOGO COMPLETO" : "ESCOLHA SUA PRÓXIMA HISTÓRIA"}</span>
          <h2>
            {completo ? "Todos os filmes" : "Em cartaz"} <span className="heading-dot">.</span>
          </h2>
          <p>{completo ? "Busque por título, filtre por gênero e escolha sua sessão." : "Filmes para sentir, pensar e compartilhar."}</p>
        </div>
      </div>
      <div className="search-row" id="searchRow">
        <label className="search-box">
          <IconeBusca />
          <input
            id="movieSearch"
            ref={buscaRef}
            type="search"
            placeholder="Busque por título..."
            aria-label="Buscar filmes"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <label className="select-wrap">
          <span>Gênero</span>
          <select
            id="genreFilter"
            value={genero}
            onChange={(e) => {
              setGenero(e.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos os gêneros</option>
            {generos.map((g) => (
              <option key={g._id} value={g._id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="results-count" id="resultsCount">
          {primeiraCarga || erro
            ? ""
            : !completo && total > filmes.length
              ? `${filmes.length} de ${total} filmes`
              : `${total} ${total === 1 ? "filme" : "filmes"}`}
        </div>
      </div>
      <div className="movie-grid" id="movieGrid" aria-live="polite">
        {conteudo}
      </div>
      <div className="center-action">
        {completo ? (
          <button
            className="btn btn-outline"
            id="loadMore"
            hidden={primeiraCarga || pagina >= paginas || !filmes.length}
            disabled={carregando}
            onClick={() => setPagina((p) => p + 1)}
          >
            {carregando ? "Carregando…" : "Carregar mais filmes"} <span>↓</span>
          </button>
        ) : (
          <Link
            to="/filmes"
            className="btn"
            id="verTodos"
            style={{ background: "var(--blue)", color: "white" }}
            hidden={primeiraCarga || (erro && !filmes.length)}
          >
            Ver todos os filmes <span>→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
