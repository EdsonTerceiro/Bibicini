import { useCallback, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Catalogo from "./components/Catalogo.jsx";
import Programacao from "./components/Programacao.jsx";
import Beneficios from "./components/Beneficios.jsx";
import Newsletter from "./components/Newsletter.jsx";
import Footer from "./components/Footer.jsx";
import Modal from "./components/Modal.jsx";
import DetalhesFilme from "./telas/DetalhesFilme.jsx";
import MapaAssentos from "./telas/MapaAssentos.jsx";
import Checkout from "./telas/Checkout.jsx";
import IngressoConfirmado from "./telas/IngressoConfirmado.jsx";
import MeusIngressos from "./telas/MeusIngressos.jsx";
import Login from "./telas/Login.jsx";
import Cadastro from "./telas/Cadastro.jsx";
import Conta from "./telas/Conta.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";

// Cada "tela" do fluxo de compra abre dentro do mesmo modal
const TELAS = {
  filme: DetalhesFilme,
  assentos: MapaAssentos,
  checkout: Checkout,
  ingresso: IngressoConfirmado,
  meus: MeusIngressos,
  login: Login,
  cadastro: Cadastro,
  conta: Conta,
};

let contador = 0;

export default function App() {
  const { usuario } = useAuth();
  const [modal, setModal] = useState(null); // { tela, props, chave }

  // abrir("assentos", { filme, sessao }) troca a tela do modal
  const abrir = useCallback((tela, props = {}) => setModal({ tela, props, chave: ++contador }), []);
  const fechar = useCallback(() => setModal(null), []);
  const abrirFilme = useCallback((id) => abrir("filme", { id }), [abrir]);

  const Tela = modal && TELAS[modal.tela];

  return (
    <>
      <Header onConta={() => abrir(usuario ? "conta" : "login")} />
      <main id="inicio">
        <Hero />
        <Catalogo onAbrirFilme={abrirFilme} />
        <Programacao onAbrirFilme={abrirFilme} />
        <Beneficios />
        <Newsletter />
      </main>
      <Footer />
      <Modal aberto={!!modal} onFechar={fechar} chave={modal?.chave}>
        {Tela && <Tela key={modal.chave} {...modal.props} abrir={abrir} fechar={fechar} />}
      </Modal>
    </>
  );
}
