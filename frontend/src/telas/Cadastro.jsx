import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Cadastro({ depois, abrir, fechar }) {
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
      depois ? abrir(depois.tela, depois.props) : fechar();
    } catch (err) {
      toast(err.message);
      setEnviando(false);
    }
  }

  return (
    <>
      <span className="kicker">CRIE SUA CONTA</span>
      <h2 id="modalTitle">Faça parte da experiência.</h2>
      <form className="form-stack" id="registerForm" onSubmit={enviar}>
        <label>
          Nome completo
          <input required minLength={2} maxLength={100} autoComplete="name" placeholder="Seu nome" {...campo("nome")} />
        </label>
        <label>
          E-mail
          <input required type="email" autoComplete="email" placeholder="voce@exemplo.com" {...campo("email")} />
        </label>
        <label>
          Senha
          <input required type="password" minLength={8} maxLength={72} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" {...campo("senha")} />
        </label>
        <label>
          <span>
            <input type="checkbox" required style={{ width: "auto" }} /> Concordo com o uso dos meus dados para a compra de
            ingressos (LGPD).
          </span>
        </label>
        <button className="btn" style={{ background: "var(--blue)", color: "white" }} disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <div className="detail-actions">
        <button className="btn btn-outline" onClick={() => abrir("login", { depois })}>
          Já tenho conta
        </button>
      </div>
    </>
  );
}
