import { useEffect, useState } from "react";
import { api } from "../api.js";
import { dia, hora } from "../util.js";

export default function Programacao({ onAbrirFilme }) {
  const [sessoes, setSessoes] = useState(null); // null = carregando
  const [erro, setErro] = useState(false);
  const hoje = new Date();

  useEffect(() => {
    api("/sessoes")
      .then((lista) => setSessoes(lista.slice(0, 3)))
      .catch(() => setErro(true));
  }, []);

  let lista;
  if (erro) lista = <p className="demo-note">Programação indisponível no momento.</p>;
  else if (!sessoes) lista = <p className="demo-note">Carregando próximas sessões…</p>;
  else if (!sessoes.length) lista = <p className="demo-note">Nenhuma sessão programada no momento.</p>;
  else
    lista = sessoes.map((s) => (
      <a
        key={s._id}
        className="session-preview"
        href="#filmes"
        onClick={(e) => {
          e.preventDefault();
          if (s.id_filme) onAbrirFilme(s.id_filme._id);
        }}
      >
        <div className="session-time">{hora(s.data_hora)}</div>
        <div>
          <b>{s.id_filme?.titulo}</b>
          <span>
            {dia(s.data_hora)} · Sala {s.id_sala?.nome}
          </span>
        </div>
        <span className="session-arrow">↗</span>
      </a>
    ));

  return (
    <section className="program-section" id="programacao">
      <div className="program-copy">
        <span className="kicker kicker-light">PLANEJE SUA IDA</span>
        <h2>
          O melhor lugar
          <br />é <em>na plateia.</em>
        </h2>
        <p>Escolha o filme, encontre seu horário e garanta seu lugar para a próxima sessão.</p>
        <a href="#filmes" className="btn btn-white">
          Encontrar uma sessão <span>↗</span>
        </a>
      </div>
      <div className="program-side">
        <div className="calendar-card">
          <div className="calendar-top">
            <span>PROGRAMAÇÃO</span>
            <span className="calendar-symbol">▦</span>
          </div>
          <div className="calendar-date">
            <b>{String(hoje.getDate()).padStart(2, "0")}</b>
            <div>
              <strong>{hoje.toLocaleDateString("pt-BR", { month: "long" }).toLocaleUpperCase("pt-BR")}</strong>
              <span>Uma boa história espera por você.</span>
            </div>
          </div>
          <div id="programPreview" aria-live="polite">
            {lista}
          </div>
        </div>
      </div>
    </section>
  );
}
