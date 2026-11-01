export default function Footer() {
  return (
    <footer className="footer">
      <a className="brand brand-footer" href="#inicio">
        <span className="brand-mark">U</span>
        <span className="brand-text">
          CINEMA <b>UNIFOR</b>
          <small>CULTURA EM CARTAZ</small>
        </span>
      </a>
      <div className="footer-center">Universidade de Fortaleza · Fortaleza, Ceará</div>
      <div className="footer-right">
        <a href="#filmes">Filmes</a>
        <a href="#programacao">Programação</a>
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
