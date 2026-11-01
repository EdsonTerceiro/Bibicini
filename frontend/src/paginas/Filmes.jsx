import Catalogo from "../components/Catalogo.jsx";

// Página de filmes ( /filmes ): mesma busca e filtro da página inicial, com o catálogo inteiro
export default function Filmes({ onAbrirFilme }) {
  return <Catalogo modo="completo" onAbrirFilme={onAbrirFilme} />;
}
