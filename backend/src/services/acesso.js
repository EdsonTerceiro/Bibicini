// Regras de acesso de cada sessão por público (Comunidade UNIFOR x Público externo).
// Cada público pode ser: "gratuito", "pago" (com preço) ou "fechado" (não pode pegar ingresso).
const { HttpError } = require('../middleware/errors');

const PUBLICOS = ['comunidade', 'externo'];
const MODOS = ['gratuito', 'pago', 'fechado'];
const NOMES = { comunidade: 'Comunidade UNIFOR', externo: 'Público externo' };
const FATOR = { inteira: 1, meia: 0.5 }; // meia-entrada = 50% (só em sessões pagas)

// Domínio institucional: e-mails @unifor.br e qualquer subdomínio (ex.: @edu.unifor.br) são Comunidade UNIFOR
const DOMINIO = (process.env.DOMINIO_COMUNIDADE || 'unifor.br').toLowerCase();
function publicoDoEmail(email = '') {
  const dominio = String(email).toLowerCase().split('@')[1] || '';
  return dominio === DOMINIO || dominio.endsWith('.' + DOMINIO) ? 'comunidade' : 'externo';
}

const arredondar = (n) => Math.round(n * 100) / 100;

// Valida o que o admin enviou: { comunidade: { modo, preco }, externo: { modo, preco } }
function normalizarPublicos(entrada) {
  if (!entrada || typeof entrada !== 'object') {
    throw new HttpError(400, 'Defina o acesso da sessão para a Comunidade UNIFOR e para o Público externo.');
  }
  const saida = {};
  for (const p of PUBLICOS) {
    const regra = entrada[p] || {};
    if (!MODOS.includes(regra.modo)) throw new HttpError(400, `Escolha se a sessão é gratuita, paga ou não disponível para: ${NOMES[p]}.`);
    let preco = 0;
    if (regra.modo === 'pago') {
      preco = Number(regra.preco);
      if (!Number.isFinite(preco) || preco <= 0 || preco > 1000) {
        throw new HttpError(400, `Informe um valor maior que zero para ${NOMES[p]}.`);
      }
      preco = arredondar(preco);
    }
    saida[p] = { modo: regra.modo, preco };
  }
  if (PUBLICOS.every((p) => saida[p].modo === 'fechado')) {
    throw new HttpError(400, 'A sessão precisa estar disponível para pelo menos um público.');
  }
  return saida;
}

// Calcula tipo e valor de cada ingresso para quem está comprando. Nunca confia no preço vindo do navegador.
function calcularIngresso(publicos, publico, tipoPedido) {
  const regra = publicos?.[publico];
  if (!regra || regra.modo === 'fechado') {
    const outro = PUBLICOS.find((p) => p !== publico);
    throw new HttpError(403, `Esta sessão é exclusiva para: ${NOMES[outro]}.`);
  }
  if (regra.modo === 'gratuito') return { tipo: 'gratuito', valor: 0 };
  const tipo = tipoPedido || 'inteira';
  if (!(tipo in FATOR)) throw new HttpError(400, 'Escolha inteira ou meia-entrada.');
  return { tipo, valor: arredondar(regra.preco * FATOR[tipo]) };
}

module.exports = { PUBLICOS, MODOS, NOMES, publicoDoEmail, normalizarPublicos, calcularIngresso };
