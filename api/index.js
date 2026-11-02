// Ponto de entrada da API na Vercel (função serverless).
// A Vercel chama esta função para toda requisição /api/... (ver vercel.json) e ela repassa para o
// mesmo app Express usado localmente (backend/server.js). O frontend é servido pela própria Vercel.
const { criarApp } = require('../backend/server');
const conectar = require('../backend/src/config/db');

let app;

module.exports = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      throw new Error('JWT_SECRET não definida (mínimo 16 caracteres) nas variáveis de ambiente da Vercel.');
    }
    await conectar(); // reaproveita a conexão entre chamadas
  } catch (err) {
    console.error('Falha ao iniciar a API:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ erro: 'Servidor indisponível no momento. Tente novamente.' }));
  }
  app ??= criarApp();
  return app(req, res);
};
