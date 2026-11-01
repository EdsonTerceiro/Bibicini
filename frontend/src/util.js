export const MAX_ASSENTOS = 6;

export const TIPOS = {
  inteira: { nome: "Inteira", fator: 1 },
  meia: { nome: "Meia-entrada (com comprovação)", fator: 0.5 },
  comunidade: { nome: "Comunidade UNIFOR", fator: 1 },
};

export const STATUS = { pago: "Pago", reservado: "Reservado", cancelado: "Cancelado", utilizado: "Utilizado" };

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
