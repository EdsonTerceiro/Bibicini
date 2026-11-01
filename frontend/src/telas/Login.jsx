import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { primeiroNome } from "../util.js";

// "depois" = tela para onde voltar após o login (ex.: o checkout)
export default function Login({ mensagem, depois, abrir, fechar }) {
  const { entrar } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await api("/auth/login", { method: "POST", body: { email, senha } });
      entrar(r.token, r.usuario);
      toast(`Olá, ${primeiroNome(r.usuario.nome)}!`);
      depois ? abrir(depois.tela, depois.props) : fechar();
    } catch (err) {
      toast(err.message);
      setEnviando(false);
    }
  }

  return (
    <>
      <span className="kicker">BEM-VINDO AO CINEMA UNIFOR</span>
      <h2 id="modalTitle">Entre para continuar.</h2>
      {mensagem && <p>{mensagem}</p>}
      <form className="form-stack" id="loginForm" onSubmit={enviar}>
        <label>
          E-mail
          <input type="email" name="email" required autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" name="senha" required autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <button className="btn" style={{ background: "var(--blue)", color: "white" }} disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="detail-actions">
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Ainda não tem conta?</span>
        <button className="btn btn-outline" id="irCadastro" onClick={() => abrir("cadastro", { depois })}>
          Criar conta
        </button>
      </div>
    </>
  );
}
