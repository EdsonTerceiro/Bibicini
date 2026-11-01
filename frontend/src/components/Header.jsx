import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Link, navegar } from "../rota.jsx";
import { primeiroNome } from "../util.js";

export const IconeBusca = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="10.8" cy="10.8" r="6.8" />
    <path d="m16 16 5 5" />
  </svg>
);

// "Programação" é só um atalho para a seção da página inicial
const MENU = [
  { to: "/", texto: "Início" },
  { to: "/filmes", texto: "Filmes" },
  { to: "/#programacao", texto: "Programação" },
];

// Avisa quando a seção (ex.: #programacao) está passando pelo meio da tela
function useSecaoNaTela(id, caminho) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    setVisivel(false);
    const secao = document.getElementById(id);
    if (!secao) return;
    // faixa no meio da tela: a seção "conta" quando ocupa essa faixa
    const observador = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), {
      rootMargin: "-45% 0px -45% 0px",
    });
    observador.observe(secao);
    return () => observador.disconnect();
  }, [id, caminho]);
  return visivel;
}

export default function Header({ caminho, onConta }) {
  const { usuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const naProgramacao = useSecaoNaTela("programacao", caminho);

  // qual item do menu fica azul
  const ativo = (to) => {
    if (to === "/#programacao") return caminho === "/" && naProgramacao;
    if (to === "/") return caminho === "/" && !naProgramacao;
    return to === caminho;
  };

  // a lupa leva para a busca; se a página atual não tiver catálogo, abre a página de filmes
  const focarBusca = () => {
    if (!document.getElementById("movieSearch")) navegar("/filmes");
    setTimeout(() => {
      document.getElementById("searchRow")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("movieSearch")?.focus();
    }, 50);
  };

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Cinema UNIFOR - início">
        <span className="brand-mark">U</span>
        <span className="brand-text">
          CINEMA <b>UNIFOR</b>
          <small>CULTURA EM CARTAZ</small>
        </span>
      </Link>
      <nav className={`main-nav${menuAberto ? " open" : ""}`} aria-label="Navegação principal">
        {MENU.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={ativo(item.to) ? "active" : undefined}
            aria-current={ativo(item.to) ? "page" : undefined}
            onClick={() => setMenuAberto(false)}
          >
            {item.texto}
          </Link>
        ))}
      </nav>
      <div className="top-actions">
        <button className="icon-button search-toggle" aria-label="Pesquisar" onClick={focarBusca}>
          <IconeBusca />
        </button>
        <button className="profile-button" id="loginBtn" onClick={onConta}>
          <span className="profile-icon">{usuario ? usuario.nome[0].toUpperCase() : "↗"}</span>
          <span>{usuario ? primeiroNome(usuario.nome) : "Entrar"}</span>
        </button>
        <button className="menu-toggle" aria-label="Abrir menu" onClick={() => setMenuAberto((v) => !v)}>
          ☰
        </button>
      </div>
    </header>
  );
}
