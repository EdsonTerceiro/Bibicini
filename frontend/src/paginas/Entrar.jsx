import { useState } from "react";
import { api } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { Link } from "../rota.jsx";
import { primeiroNome } from "../util.js";

// Página de login ( /entrar ). onSucesso volta para onde o usuário estava (ex.: a compra).
export default function Entrar({ mensagem, onSucesso }) {
  const { usuario, entrar } = useAuth();
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
      onSucesso();
    } catch (err) {
      toast(err.message);
      setEnviando(false);
    }
  }

  if (usuario)
    return (
      <AuthLayout subtitulo="MINHA CONTA" titulo="Você já entrou">
        <p className="auth-texto">Você está conectado como {usuario.email}.</p>
        <Link to="/" className="btn auth-botao">
          Ir para o início
        </Link>
      </AuthLayout>
    );

  return (
    <AuthLayout subtitulo="BEM-VINDO DE VOLTA" titulo="Entrar">
      {mensagem ? (
        <p className="auth-aviso">{mensagem}</p>
      ) : (
        <p className="auth-texto">Use seu e-mail e senha cadastrados.</p>
      )}
      <form className="form-stack" id="loginForm" onSubmit={enviar}>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            name="senha"
            required
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        <button className="btn auth-botao" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="auth-troca">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" id="irCadastro">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
