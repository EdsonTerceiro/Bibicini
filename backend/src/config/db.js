const mongoose = require('mongoose');

async function conectar() {
  // aceita MONGODB_URI (padrão) ou MONGO_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI não definida. Configure o arquivo .env.');
  // dbName garante o banco "cinema" mesmo que a URI não termine com /cinema
  await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'cinema' });
  console.log(`MongoDB Atlas conectado (banco: ${mongoose.connection.name})`);
}

module.exports = conectar;
