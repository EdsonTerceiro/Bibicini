import Hero from "../components/Hero.jsx";
import Catalogo from "../components/Catalogo.jsx";
import Programacao from "../components/Programacao.jsx";
import Beneficios from "../components/Beneficios.jsx";
import Newsletter from "../components/Newsletter.jsx";

// Página inicial ( / )
export default function Inicio({ onAbrirFilme }) {
  return (
    <>
      <Hero />
      <Catalogo modo="destaque" onAbrirFilme={onAbrirFilme} />
      <Programacao onAbrirFilme={onAbrirFilme} />
      <Beneficios />
      <Newsletter />
    </>
  );
}
