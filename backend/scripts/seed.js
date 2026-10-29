// Popula o banco com dados de exemplo: gêneros, salas com assentos, filmes, sessões, cupom e admin.
// Uso:  npm run seed            (idempotente: pode rodar várias vezes)
//       npm run seed -- --limpar (apaga TUDO antes de popular)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const conectar = require('../src/config/db');
const { Genero, Sala, Usuario, Cupom, Filme, Sessao } = {
  Genero: require('../src/models/Genero'),
  Sala: require('../src/models/Sala'),
  Usuario: require('../src/models/Usuario'),
  Cupom: require('../src/models/Cupom'),
  Filme: require('../src/models/Filme'),
  Sessao: require('../src/models/Sessao'),
};

const FILMES = [
  { titulo: 'Duna: Parte Dois', duracao_min: 166, classificacao: '14', genero: 'Ficção científica' },
  { titulo: 'Divertida Mente 2', duracao_min: 96, classificacao: 'Livre', genero: 'Animação' },
  { titulo: 'Oppenheimer', duracao_min: 180, classificacao: '16', genero: 'Drama' },
  { titulo: 'Interestelar', duracao_min: 169, classificacao: '10', genero: 'Ficção científica' },
];

async function main() {
  await conectar();
  if (process.argv.includes('--limpar')) {
    await mongoose.connection.dropDatabase();
    console.log('Banco limpo.');
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  }

  // Gêneros
  const generos = {};
  for (const nome of [...new Set(FILMES.map((f) => f.genero))]) {
    generos[nome] = await Genero.findOneAndUpdate({ nome }, { nome }, { upsert: true, returnDocument: 'after' });
  }

  // Salas com 40 assentos (A1..E8), igual ao mapa do frontend
  const salas = [];
  for (const numero of [1, 2]) {
    let sala = await Sala.findOne({ numero });
    if (!sala) {
      const assentos = [];
      for (const fileira of ['A', 'B', 'C', 'D', 'E']) {
        for (let n = 1; n <= 8; n++) assentos.push({ fileira, numero: n });
      }
      sala = await Sala.create({ numero, capacidade: 40, assentos });
    }
    salas.push(sala);
  }

  // Filmes
  const filmes = [];
  for (const f of FILMES) {
    const { genero, ...resto } = f;
    filmes.push(await Filme.findOneAndUpdate(
      { titulo: f.titulo }, { ...resto, id_genero: generos[genero]._id }, { upsert: true, returnDocument: 'after' }
    ));
  }

  // Sessões dos próximos 3 dias. Cada sala alterna dois filmes em 3 horários (13:00, 16:30, 20:00).
  const horarios = [[13, 0], [16, 30], [20, 0]];
  const operacoes = [];
  for (let dia = 0; dia < 3; dia++) {
    filmes.forEach((filme, i) => {
      const sala = salas[i % 2];
      const usados = Math.floor(i / 2) === 0 ? [0, 2] : [1];
      for (const k of usados) {
        const data = new Date();
        data.setDate(data.getDate() + dia);
        data.setHours(horarios[k][0], horarios[k][1], 0, 0);
        if (data <= new Date()) continue;
        operacoes.push({
          updateOne: {
            filter: { id_sala: sala._id, data_hora: data },
            update: { $setOnInsert: { id_filme: filme._id, preco: 16 } },
            upsert: true,
          },
        });
      }
    });
  }
  if (operacoes.length) await Sessao.bulkWrite(operacoes);

  // Cupom e administrador
  await Cupom.findOneAndUpdate({ codigo: 'UNIFOR10' }, { codigo: 'UNIFOR10', desconto: 10 }, { upsert: true });
  const email = (process.env.ADMIN_EMAIL || 'admin@unifor.br').toLowerCase();
  if (!(await Usuario.exists({ email }))) {
    await Usuario.create({
      nome: 'Administrador', email, tipo_usuario: 'admin',
      senha_hash: await bcrypt.hash(process.env.ADMIN_SENHA || 'Admin@12345', 10),
    });
    console.log(`Administrador criado: ${email}`);
  }

  console.log('Seed concluído:', {
    generos: await Genero.countDocuments(), salas: await Sala.countDocuments(),
    filmes: await Filme.countDocuments(), sessoes: await Sessao.countDocuments(),
  });
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
