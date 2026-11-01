import { useState } from "react";
import { api } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { Link } from "../rota.jsx";

// Página de cadastro ( /cadastro )
export default function Cadastro({ onSucesso }) {
  const { entrar } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [enviando, setEnviando] = useState(false);
  const campo = (nome) => ({ name: nome, value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await api("/auth/registrar", { method: "POST", body: form });
      entrar(r.token, r.usuario);
      toast("Conta criada com sucesso!");
      onSucesso();
    } catch (err) {
      toast(err.message);
      setEnviando(false);
    }
  }

  return (
    <AuthLayout subtitulo="CRIE SUA CONTA" titulo="Cadastro">
      <p className="auth-texto">Leva menos de um minuto.</p>
      <form className="form-stack" id="registerForm" onSubmit={enviar}>
        <label>
          Nome completo
          <input required autoFocus minLength={2} maxLength={100} autoComplete="name" placeholder="Seu nome" {...campo("nome")} />
        </label>
        <label>
          E-mail
          <input required type="email" autoComplete="email" placeholder="voce@exemplo.com" {...campo("email")} />
        </label>
        <label>
          Senha
          <input
            required
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            {...campo("senha")}
          />
        </label>
        <label className="auth-check">
          <input type="checkbox" required /> Concordo com o uso dos meus dados para a compra de ingressos (LGPD).
        </label>
        <button className="btn auth-botao" disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="auth-troca">
        Já tem conta?{" "}
        <Link to="/entrar" id="irLogin">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
