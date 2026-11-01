export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow">
          <span className="live-dot"></span> EXPERIÊNCIA CINEMA UNIFOR
        </div>
        <h1>
          Grandes histórias.
          <br />
          <span>Novos olhares.</span>
        </h1>
        <p>
          Seu próximo filme favorito está a poucos cliques. Explore a programação, descubra histórias e viva o cinema na
          UNIFOR.
        </p>
        <div className="hero-actions">
          <a className="btn btn-white" href="#filmes">
            Explorar filmes <span>↗</span>
          </a>
          <a className="hero-link" href="#programacao">
            Ver programação <span>→</span>
          </a>
        </div>
        <div className="hero-note">
          <span className="note-icon">✦</span>
          <span>
            <b>Cultura que aproxima.</b>
            <br />
            Um espaço para histórias que ficam.
          </span>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="orb orb-one"></div>
        <div className="orb orb-two"></div>
        <div className="film-frame frame-back"></div>
        <div className="film-frame frame-front">
          <div className="frame-shine"></div>
          <div className="frame-caption">
            A PRÓXIMA HISTÓRIA
            <br />
            <b>COMEÇA AQUI.</b>
          </div>
        </div>
        <div className="floating-tag tag-top">TELA GRANDE. IDEIAS MAIORES.</div>
        <div className="floating-tag tag-bottom">
          <span>✦</span> Feito para descobrir
        </div>
        <div className="art-spark spark-one">✳</div>
        <div className="art-spark spark-two">✦</div>
      </div>
      <div className="hero-bottom">
        <span>01 / DESCOBRIR</span>
        <span className="hero-line"></span>
        <span>UNIVERSIDADE DE FORTALEZA</span>
      </div>
    </section>
  );
}
