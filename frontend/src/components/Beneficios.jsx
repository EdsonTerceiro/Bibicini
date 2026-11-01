const ITENS = [
  ["01", "✳", "Descubra", "Explore títulos, gêneros e histórias de diferentes lugares e perspectivas."],
  ["02", "▦", "Planeje", "Consulte sessões e escolha seus assentos de forma simples."],
  ["03", "✦", "Compartilhe", "O cinema aproxima pessoas e abre espaço para novas conversas."],
];

export default function Beneficios() {
  return (
    <section className="benefits-section" id="sobre">
      <div className="section-heading">
        <div>
          <span className="kicker">MAIS QUE UM FILME</span>
          <h2>Viva a experiência.</h2>
          <p>Um ponto de encontro entre cultura, conhecimento e emoção.</p>
        </div>
      </div>
      <div className="benefit-grid">
        {ITENS.map(([numero, icone, titulo, texto]) => (
          <article className="benefit-card" key={numero}>
            <span className="benefit-number">{numero}</span>
            <div className="benefit-icon">{icone}</div>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
