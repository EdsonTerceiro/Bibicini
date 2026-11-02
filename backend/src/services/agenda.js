// RF031 — Controle de conflito de sessões: duas sessões não podem ocupar a mesma sala ao mesmo tempo.
// Cada sessão ocupa a sala do início até o fim do filme + um intervalo de limpeza/troca de público.
const INTERVALO_MIN = Number(process.env.INTERVALO_SESSOES_MIN ?? 15);
const MINUTO = 60 * 1000;

// fim da ocupação da sala = início + duração do filme + intervalo
const fimDaOcupacao = (inicio, duracaoMin, intervalo = INTERVALO_MIN) =>
  new Date(new Date(inicio).getTime() + (Number(duracaoMin) + intervalo) * MINUTO);

// nova: { inicio, duracao }   existentes: [{ inicio, duracao, titulo }]  ->  primeiro conflito (ou null)
function acharConflito(nova, existentes, intervalo = INTERVALO_MIN) {
  const ini = new Date(nova.inicio).getTime();
  const fim = fimDaOcupacao(nova.inicio, nova.duracao, intervalo).getTime();
  for (const e of existentes) {
    const eIni = new Date(e.inicio).getTime();
    const eFim = fimDaOcupacao(e.inicio, e.duracao, intervalo).getTime();
    if (ini < eFim && eIni < fim) return { ...e, fim: new Date(eFim) }; // os intervalos se cruzam
  }
  return null;
}

// "14:30" no horário do cinema (Fortaleza), mesmo com o servidor em outro fuso
const hora = (data) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: process.env.FUSO_CINEMA || 'America/Fortaleza', hour: '2-digit', minute: '2-digit',
  }).format(new Date(data));

function mensagemConflito(nova, conflito, intervalo = INTERVALO_MIN) {
  return `Conflito de horário na sala: "${conflito.titulo}" ocupa das ${hora(conflito.inicio)} às ${hora(conflito.fim)} `
    + `(filme + ${intervalo} min de intervalo). A nova sessão iria das ${hora(nova.inicio)} às `
    + `${hora(fimDaOcupacao(nova.inicio, nova.duracao, intervalo))}.`;
}

module.exports = { INTERVALO_MIN, fimDaOcupacao, acharConflito, mensagemConflito };
