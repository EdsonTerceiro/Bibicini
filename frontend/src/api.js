// Cliente da API do backend. Em desenvolvimento o Vite repassa /api para o backend (ver vite.config.js).
// Depois de hospedar em outro domínio, defina VITE_API_URL (ex.: https://seu-backend.onrender.com/api).
const API = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const tokenSalvo = () => localStorage.getItem("unifor_token") || "";

export async function api(caminho, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenSalvo();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(API + caminho, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique se o backend está rodando (npm start).");
  }
  if (res.status === 204) return null;
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event("auth:expirada")); // o AuthContext faz o logout
      throw new ApiError(401, "Sua sessão expirou. Entre novamente.");
    }
    const detalhes = dados.detalhes?.length ? " " + dados.detalhes.join(" ") : "";
    throw new ApiError(res.status, (dados.erro || `Erro ${res.status}.`) + detalhes);
  }
  return dados;
}
