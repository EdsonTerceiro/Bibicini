export const MAX_ASSENTOS = 6;

// tipo do ingresso: "gratuito" quando a sessão não cobra do público da pessoa
export const TIPOS = {
  inteira: { nome: "Inteira", fator: 1 },
  meia: { nome: "Meia-entrada (com comprovação)", fator: 0.5 },
  gratuito: { nome: "Gratuito", fator: 0 },
};

// status "pago" no banco = ingresso confirmado (vale também para os gratuitos)
export const STATUS = { pago: "Confirmado", reservado: "Reservado", cancelado: "Cancelado", utilizado: "Utilizado" };

// Públicos de cada sessão e como cada um entra: gratuito, pago (R$) ou fechado
export const PUBLICOS = { comunidade: "Comunidade UNIFOR", externo: "Público externo" };
export const MODOS = { gratuito: "Gratuito", pago: "Pago", fechado: "Não disponível" };

// Mesma regra do backend: e-mail @unifor.br (ou subdomínio, ex.: @edu.unifor.br) = Comunidade UNIFOR.
// O servidor é quem decide de verdade; aqui é só para mostrar na tela.
export function publicoDe(usuario) {
  if (!usuario) return null;
  if (usuario.publico) return usuario.publico;
  const dominio = (usuario.email || "").toLowerCase().split("@")[1] || "";
  return dominio === "unifor.br" || dominio.endsWith(".unifor.br") ? "comunidade" : "externo";
}

export const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const hora = (d) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function dia(d) {
  const data = new Date(d);
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);
  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === amanha.toDateString()) return "Amanhã";
  return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export const dataHora = (d) => `${dia(d)}, ${hora(d)}`;

export const posterUrl = (caminho, tamanho = "w500") => (caminho ? `https://image.tmdb.org/t/p/${tamanho}${caminho}` : "");

export const classif = (c) => (!c || /^livre$/i.test(c) ? "L" : c);

export const primeiroNome = (nome = "") => nome.split(" ")[0];

// Link gravado no QR Code do ingresso: abre o painel já no pedido, para validar a entrada
export const linkValidacao = (codigo) => `${window.location.origin}/admin?pedido=${encodeURIComponent(codigo)}`;

// "Gratuito", "R$ 16,00" ou "Não disponível"
export function textoRegra(regra) {
  if (!regra) return "—";
  if (regra.modo === "pago") return brl(regra.preco);
  return MODOS[regra.modo] || regra.modo;
}

// valor de um ingresso para uma regra (prévia na tela; o servidor calcula o valor real)
export function valorIngresso(regra, tipo = "inteira") {
  if (!regra || regra.modo !== "pago") return 0;
  return Math.round(regra.preco * (TIPOS[tipo]?.fator ?? 1) * 100) / 100;
}

export const valorOuGratis = (v) => (Number(v) > 0 ? brl(v) : "Gratuito");
