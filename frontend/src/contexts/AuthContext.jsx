import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Guarda o usuário logado e o token JWT (também salvos no navegador para manter o login ao recarregar)
const AuthContext = createContext(null);

function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("unifor_usuario") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(lerUsuario);

  const entrar = useCallback((token, dados) => {
    localStorage.setItem("unifor_token", token);
    localStorage.setItem("unifor_usuario", JSON.stringify(dados));
    setUsuario(dados);
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem("unifor_token");
    localStorage.removeItem("unifor_usuario");
    setUsuario(null);
  }, []);

  // Token expirado ou inválido: a função api() avisa por este evento
  useEffect(() => {
    window.addEventListener("auth:expirada", sair);
    return () => window.removeEventListener("auth:expirada", sair);
  }, [sair]);

  return <AuthContext.Provider value={{ usuario, entrar, sair }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
