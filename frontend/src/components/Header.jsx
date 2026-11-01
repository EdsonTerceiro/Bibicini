import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { primeiroNome } from "../util.js";

export const IconeBusca = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="10.8" cy="10.8" r="6.8" />
    <path d="m16 16 5 5" />
  </svg>
);

export default function Header({ onConta }) {
  const { usuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const focarBusca = () => {
    document.getElementById("searchRow")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("movieSearch")?.focus();
  };

  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Cinema UNIFOR - início">
        <span className="brand-mark">U</span>
        <span className="brand-text">
          CINEMA <b>UNIFOR</b>
          <small>CULTURA EM CARTAZ</small>
        </span>
      </a>
      <nav className={`main-nav${menuAberto ? " open" : ""}`} aria-label="Navegação principal">
        {[
          ["#inicio", "Início"],
          ["#filmes", "Filmes"],
          ["#programacao", "Programação"],
          ["#sobre", "O cinema"],
        ].map(([href, texto], i) => (
          <a key={href} className={i === 0 ? "active" : undefined} href={href} onClick={() => setMenuAberto(false)}>
            {texto}
          </a>
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
