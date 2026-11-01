// Moldura das páginas de login e cadastro: painel azul à esquerda, formulário à direita
export default function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <aside className="auth-side" aria-hidden="true">
          <span className="kicker kicker-light">CINEMA UNIFOR</span>
          <h2>
            Sua próxima sessão
            <br />
            <em>começa aqui.</em>
          </h2>
          <p>Compre ingressos, escolha seus lugares e acompanhe seus pedidos em um só lugar.</p>
          <ul className="auth-beneficios">
            <li>✦ Escolha de assentos em tempo real</li>
            <li>✦ Meia-entrada e cupons de desconto</li>
            <li>✦ Seus ingressos sempre à mão</li>
          </ul>
        </aside>
        <div className="auth-form">
          <span className="kicker">{subtitulo}</span>
          <h1 id="authTitle">{titulo}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}
