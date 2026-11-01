import { useEffect, useState } from "react";

// Roteador simples: cada página tem um endereço (/, /filmes, /entrar, /cadastro)
// usando o histórico do navegador (os botões voltar/avançar funcionam).

const EVENTO = "rota:mudou";

export function useRota() {
  const [caminho, setCaminho] = useState(window.location.pathname);
  useEffect(() => {
    const atualizar = () => setCaminho(window.location.pathname);
    window.addEventListener("popstate", atualizar);
    window.addEventListener(EVENTO, atualizar);
    return () => {
      window.removeEventListener("popstate", atualizar);
      window.removeEventListener(EVENTO, atualizar);
    };
  }, []);
  return caminho;
}

// Rola até a âncora (#programacao) ou para o topo da página
export function rolar(ancora) {
  if (!ancora) return setTimeout(() => window.scrollTo(0, 0), 0);
  // a seção pode ainda não ter sido desenhada (troca de página): tenta por até ~1 segundo
  let tentativas = 0;
  const tentar = () => {
    const alvo = document.getElementById(ancora);
    if (!alvo) {
      if (++tentativas < 40) setTimeout(tentar, 25);
      return;
    }
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    // filmes e sessões terminam de carregar e empurram a seção para baixo: corrige a posição
    for (const espera of [700, 1400]) {
      setTimeout(() => {
        if (Math.abs(alvo.getBoundingClientRect().top) > 10) alvo.scrollIntoView({ block: "start" });
      }, espera);
    }
  };
  setTimeout(tentar, 0);
}

// navegar("/filmes") ou navegar("/#programacao")
export function navegar(destino) {
  const [caminho, ancora] = destino.split("#");
  const novo = caminho || "/";
  if (novo !== window.location.pathname || ancora) {
    window.history.pushState({}, "", novo + (ancora ? "#" + ancora : ""));
    window.dispatchEvent(new Event(EVENTO));
  }
  rolar(ancora);
}

// <Link to="/filmes">Filmes</Link> — funciona como <a>, sem recarregar a página
export function Link({ to, onClick, children, ...resto }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // abrir em nova aba
        e.preventDefault();
        onClick?.(e);
        navegar(to);
      }}
      {...resto}
    >
      {children}
    </a>
  );
}
