import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Link } from "../rota.jsx";
import Resumo from "../admin/Resumo.jsx";
import AdminFilmes from "../admin/AdminFilmes.jsx";
import AdminSessoes from "../admin/AdminSessoes.jsx";
import AdminSalas from "../admin/AdminSalas.jsx";
import AdminVendas from "../admin/AdminVendas.jsx";

const ABAS = {
  "Visão geral": Resumo,
  Filmes: AdminFilmes,
  Sessões: AdminSessoes,
  Salas: AdminSalas,
  Vendas: AdminVendas,
};

// Página do painel administrativo ( /admin ) — só para usuários com tipo_usuario "admin"
export default function Admin({ pedirLogin }) {
  const { usuario } = useAuth();
  // aberto pelo QR Code do ingresso: /admin?pedido=UNF-XXXX -> vai direto para Vendas
  const [pedidoQr] = useState(() => new URLSearchParams(window.location.search).get("pedido"));
  const [aba, setAba] = useState(pedidoQr ? "Vendas" : "Visão geral");

  if (!usuario || usuario.tipo_usuario !== "admin")
    return (
      <section className="content-section">
        <div className="empty-state">
          <b>Área administrativa</b>
          <p>{usuario ? "Sua conta não tem permissão para acessar o painel." : "Entre com uma conta de administrador."}</p>
          {usuario ? (
            <Link to="/" className="btn btn-azul">
              Voltar ao início
            </Link>
          ) : (
            <button
              className="btn btn-azul"
              id="entrarAdmin"
              onClick={() => pedirLogin({ mensagem: "Entre com uma conta de administrador para acessar o painel." })}
            >
              Entrar
            </button>
          )}
        </div>
      </section>
    );

  const Conteudo = ABAS[aba];
  return (
    <section className="content-section admin-page">
      <nav className="breadcrumb" aria-label="Você está em">
        <Link to="/">Início</Link> <span>/</span> Painel administrativo
      </nav>
      <div className="section-heading">
        <div>
          <span className="kicker">PAINEL ADMINISTRATIVO</span>
          <h2>
            Gestão do cinema <span className="heading-dot">.</span>
          </h2>
          <p>Cadastre filmes, salas e sessões e acompanhe as vendas.</p>
        </div>
      </div>
      <div className="admin-tabs" role="tablist">
        {Object.keys(ABAS).map((nome) => (
          <button
            key={nome}
            role="tab"
            aria-selected={aba === nome}
            className={aba === nome ? "active" : undefined}
            data-aba={nome}
            onClick={() => setAba(nome)}
          >
            {nome}
          </button>
        ))}
      </div>
      <Conteudo key={aba} {...(aba === "Vendas" ? { pedidoInicial: pedidoQr } : {})} />
    </section>
  );
}
