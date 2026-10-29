const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 150 },
    tipo_usuario: { type: String, enum: ['cliente', 'admin', 'funcionario'], default: 'cliente' },
    senha_hash: { type: String, required: true, select: false },
  },
  { timestamps: true, collection: 'usuarios' }
);

module.exports = model('Usuario', usuarioSchema);
