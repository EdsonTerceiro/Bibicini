// Popula o banco com dados de exemplo: gêneros, salas A–E com assentos, filmes, sessões e admin.
// Uso:  npm run seed            (idempotente: pode rodar várias vezes)
//       npm run seed -- --limpar (apaga TUDO antes de popular)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const conectar = require('../src/config/db');
const { tmdbGet } = require('../src/services/tmdb');
const Genero = require('../src/models/Genero');
const Sala = require('../src/models/Sala');
const Usuario = require('../src/models/Usuario');
const Filme = require('../src/models/Filme');
const Sessao = require('../src/models/Sessao');

const FILMES = [
  { titulo: 'Duna: Parte Dois', duracao_min: 166, classificacao: '14', genero: 'Ficção científica', tmdb_id: 693134 },
  { titulo: 'Divertida Mente 2', duracao_min: 96, classificacao: 'Livre', genero: 'Animação', tmdb_id: 1022789 },
  { titulo: 'Oppenheimer', duracao_min: 180, classificacao: '16', genero: 'Drama', tmdb_id: 872585 },
  { titulo: 'Interestelar', duracao_min: 169, classificacao: '10', genero: 'Ficção científica', tmdb_id: 157336 },
  { titulo: 'Batman: O Cavaleiro das Trevas', duracao_min: 152, classificacao: '12', genero: 'Ação', tmdb_id: 155 },
  { titulo: 'A Origem', duracao_min: 148, classificacao: '14', genero: 'Ficção científica', tmdb_id: 27205 },
  { titulo: 'Parasita', duracao_min: 132, classificacao: '16', genero: 'Suspense', tmdb_id: 496243 },
  { titulo: 'A Viagem de Chihiro', duracao_min: 125, classificacao: 'Livre', genero: 'Animação', tmdb_id: 129 },
  { titulo: 'Barbie', duracao_min: 114, classificacao: '12', genero: 'Comédia', tmdb_id: 346698 },
  { titulo: 'Wicked', duracao_min: 160, classificacao: '10', genero: 'Fantasia', tmdb_id: 402431 },
  { titulo: 'Gladiador II', duracao_min: 148, classificacao: '16', genero: 'Ação', tmdb_id: 558449 },
  { titulo: 'Moana 2', duracao_min: 100, classificacao: 'Livre', genero: 'Animação', tmdb_id: 1241982 },
];

const SALAS = ['A', 'B', 'C', 'D', 'E']; // salas do Cinema UNIFOR
const FILEIRAS = ['A', 'B', 'C', 'D', 'E']; // fileiras de assentos dentro de cada sala
const POR_FILEIRA = 8;
// Sessões a partir das 13:00, com 3h30 entre elas (nenhum filme passa de 3h)
const HORARIOS = ['13:00', '16:30', '20:00'];
const DIAS = 6; // gera sessões para hoje e os próximos dias (pulando domingos)

// Datas sempre no horário de Fortaleza (UTC-3), mesmo se o servidor estiver em outro fuso
const diaFortaleza = (data) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(data);
function proximosDias(qtd) {
  const hoje = diaFortaleza(new Date());
  const dias = [];
  for (let i = 0; i < qtd; i++) {
    const meioDia = new Date(new Date(`${hoje}T12:00:00-03:00`).getTime() + i * 86400000);
    if (meioDia.getUTCDay() === 0) continue; // domingo: sem sessões
    dias.push(diaFortaleza(meioDia));
  }
  return dias;
}

async function main() {
  await conectar();
  if (process.argv.includes('--limpar')) {
    await mongoose.connection.dropDatabase();
    console.log('Banco limpo.');
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  } else if (await Sala.collection.countDocuments({ nome: { $exists: false } })) {
    console.error('O banco tem salas no formato antigo (Sala 1, 2, 3). Rode:  npm run seed -- --limpar');
    process.exit(1);
  }

  // Gêneros
  const generos = {};
  for (const nome of [...new Set(FILMES.map((f) => f.genero))]) {
    generos[nome] = await Genero.findOneAndUpdate({ nome }, { nome }, { upsert: true, returnDocument: 'after' });
  }

  // Salas A–E, cada uma com 40 assentos (fileiras A–E × 8)
  const salas = [];
  for (const nome of SALAS) {
    let sala = await Sala.findOne({ nome });
    if (!sala) {
      const assentos = [];
      for (const fileira of FILEIRAS) for (let n = 1; n <= POR_FILEIRA; n++) assentos.push({ fileira, numero: n });
      sala = await Sala.create({ nome, capacidade: assentos.length, assentos });
    }
    salas.push(sala);
  }

  // Filmes
  const filmes = [];
  for (const f of FILMES) {
    const { genero, ...resto } = f;
    // Com TMDB_API_KEY no .env, busca cartaz e sinopse para o site ficar completo
    if (process.env.TMDB_API_KEY) {
      try {
        const t = await tmdbGet(`movie/${f.tmdb_id}`, { language: 'pt-BR' });
        if (t.poster_path) resto.poster_path = t.poster_path;
        if (t.overview) resto.sinopse = t.overview;
      } catch (e) {
        console.warn(`TMDB indisponível para "${f.titulo}": ${e.message}`);
      }
    }
    filmes.push(await Filme.findOneAndUpdate(
      { titulo: f.titulo }, { ...resto, id_genero: generos[genero]._id }, { upsert: true, returnDocument: 'after' }
    ));
  }

  // Sessões: 5 salas × 3 horários = 15 vagas por dia para os 12 filmes, de segunda a sábado
  const operacoes = [];
  for (const dia of proximosDias(DIAS)) {
    filmes.forEach((filme, i) => {
      const sala = salas[i % salas.length];
      const horario = HORARIOS[Math.floor(i / salas.length) % HORARIOS.length];
      const data = new Date(`${dia}T${horario}:00-03:00`);
      if (data <= new Date()) return; // não cria sessão que já passou
      operacoes.push({
        updateOne: {
          filter: { id_sala: sala._id, data_hora: data },
          update: { $setOnInsert: { id_filme: filme._id, preco: 16 } },
          upsert: true,
        },
      });
    });
  }
  if (operacoes.length) await Sessao.bulkWrite(operacoes);

  // Administrador
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
