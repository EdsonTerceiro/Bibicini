import { useState } from "react";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState("");

  return (
    <section className="newsletter">
      <div>
        <span className="kicker kicker-light">FIQUE POR DENTRO</span>
        <h2>
          Novidades na tela.
          <br />
          <em>Inspiração na vida.</em>
        </h2>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setEmail("");
          toast("Obrigado! Você receberá novidades da programação.");
        }}
      >
        <label htmlFor="newsletterEmail">Receba novidades sobre filmes e programação.</label>
        <div className="newsletter-input">
          <input
            id="newsletterEmail"
            type="email"
            placeholder="Seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button aria-label="Cadastrar e-mail">→</button>
        </div>
        <small>Projeto acadêmico.</small>
      </form>
    </section>
  );
}
