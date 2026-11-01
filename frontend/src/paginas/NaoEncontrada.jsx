import { Link } from "../rota.jsx";

export default function NaoEncontrada() {
  return (
    <section className="content-section">
      <div className="empty-state">
        <b>Página não encontrada</b>
        <p>O endereço digitado não existe.</p>
        <Link to="/" className="btn" style={{ background: "var(--blue)", color: "white" }}>
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
