import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Modal from "./components/Modal.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Filmes from "./paginas/Filmes.jsx";
import Entrar from "./paginas/Entrar.jsx";
import Cadastro from "./paginas/Cadastro.jsx";
import Admin from "./paginas/Admin.jsx";
import NaoEncontrada from "./paginas/NaoEncontrada.jsx";
import DetalhesFilme from "./telas/DetalhesFilme.jsx";
import MapaAssentos from "./telas/MapaAssentos.jsx";
import Checkout from "./telas/Checkout.jsx";
import IngressoConfirmado from "./telas/IngressoConfirmado.jsx";
import MeusIngressos from "./telas/MeusIngressos.jsx";
import Conta from "./telas/Conta.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { navegar, rolar, useRota } from "./rota.jsx";

// Telas do fluxo de compra: abrem por cima da página, dentro do modal
const TELAS = {
  filme: DetalhesFilme,
  assentos: MapaAssentos,
  checkout: Checkout,
  ingresso: IngressoConfirmado,
  meus: MeusIngressos,
  conta: Conta,
};

let contador = 0;

export default function App() {
  const caminho = useRota();
  const { usuario } = useAuth();
  const [modal, setModal] = useState(null); // { tela, props, chave }
  // o que fazer depois do login: { voltar: "/filmes", tela?: "checkout", props?, mensagem? }
  const [aposLogin, setAposLogin] = useState(null);

  const abrir = useCallback((tela, props = {}) => setModal({ tela, props, chave: ++contador }), []);
  const fechar = useCallback(() => setModal(null), []);
  const abrirFilme = useCallback((id) => abrir("filme", { id }), [abrir]);

  // leva para a página de login e guarda para onde voltar (ex.: o checkout da compra)
  const pedirLogin = useCallback((opcoes = {}) => {
    setModal(null);
    setAposLogin({ voltar: window.location.pathname + window.location.search, ...opcoes });
    navegar("/entrar");
  }, []);

  const concluirLogin = useCallback(() => {
    const p = aposLogin;
    setAposLogin(null);
    const voltar = p?.voltar && !/^\/(entrar|cadastro)\b/.test(p.voltar) ? p.voltar : "/";
    navegar(voltar);
    if (p?.tela) abrir(p.tela, p.props);
  }, [aposLogin, abrir]);

  // ao abrir o site já com âncora (ex.: /#programacao), rola até ela
  useEffect(() => {
    if (window.location.hash) rolar(window.location.hash.slice(1));
  }, []);

  let pagina;
  if (caminho === "/") pagina = <Inicio onAbrirFilme={abrirFilme} />;
  else if (caminho === "/filmes") pagina = <Filmes onAbrirFilme={abrirFilme} />;
  else if (caminho === "/entrar") pagina = <Entrar mensagem={aposLogin?.mensagem} onSucesso={concluirLogin} />;
  else if (caminho === "/cadastro") pagina = <Cadastro onSucesso={concluirLogin} />;
  else if (caminho === "/admin") pagina = <Admin pedirLogin={pedirLogin} />;
  else pagina = <NaoEncontrada />;

  const Tela = modal && TELAS[modal.tela];

  return (
    <>
      <Header caminho={caminho} onConta={() => (usuario ? abrir("conta") : pedirLogin())} />
      <main id="inicio">{pagina}</main>
      <Footer />
      <Modal aberto={!!modal} onFechar={fechar} chave={modal?.chave}>
        {Tela && <Tela key={modal.chave} {...modal.props} abrir={abrir} fechar={fechar} pedirLogin={pedirLogin} />}
      </Modal>
    </>
  );
}
