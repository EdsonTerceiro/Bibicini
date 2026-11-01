import { Link } from "../rota.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <Link className="brand brand-footer" to="/">
        <span className="brand-mark">U</span>
        <span className="brand-text">
          CINEMA <b>UNIFOR</b>
          <small>CULTURA EM CARTAZ</small>
        </span>
      </Link>
      <div className="footer-center">Universidade de Fortaleza · Fortaleza, Ceará</div>
      <div className="footer-right">
        <Link to="/filmes">Filmes</Link>
        <Link to="/#programacao">Programação</Link>
        <Link to="/admin" id="adminLink">Área administrativa</Link>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Cinema UNIFOR · Projeto acadêmico</span>
        <span>
          Feito para descobrir novas histórias <b>✦</b>
        </span>
      </div>
    </footer>
  );
}
