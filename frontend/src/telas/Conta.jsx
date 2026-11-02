import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { PUBLICOS, primeiroNome, publicoDe } from "../util.js";
import { navegar } from "../rota.jsx";

export default function Conta({ abrir, fechar }) {
  const { usuario, sair } = useAuth();
  const toast = useToast();
  if (!usuario) return null;
  return (
    <>
      <span className="kicker">MINHA CONTA</span>
      <h2 id="modalTitle">Olá, {primeiroNome(usuario.nome)}!</h2>
      <p>{usuario.email}</p>
      <p>
        <span className={`pill perfil-${publicoDe(usuario)}`} id="perfilPublico">
          {PUBLICOS[publicoDe(usuario)]}
        </span>
      </p>
      <div className="detail-actions">
        <button className="btn" style={{ background: "var(--blue)", color: "white" }} onClick={() => abrir("meus")}>
          Meus ingressos
        </button>
        {usuario.tipo_usuario === "admin" && (
          <button
            className="btn btn-outline"
            id="contaAdmin"
            onClick={() => {
              fechar();
              navegar("/admin");
            }}
          >
            Painel administrativo
          </button>
        )}
        <button
          className="btn btn-outline"
          id="contaSair"
          onClick={() => {
            sair();
            fechar();
            toast("Você saiu da sua conta.");
          }}
        >
          Sair
        </button>
      </div>
    </>
  );
}
