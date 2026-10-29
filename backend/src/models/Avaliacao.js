const { Schema, model } = require('mongoose');

// FILME (1) RECEBE (N) AVALIACAO | USUARIO (1) ESCREVE (N) AVALIACAO
const avaliacaoSchema = new Schema(
  {
    nota: { type: Number, required: true, min: 0, max: 10, validate: Number.isInteger },
    comentario: { type: String, trim: true, maxlength: 1000 },
    id_filme: { type: Schema.Types.ObjectId, ref: 'Filme', required: true, index: true },
    id_usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  },
  { timestamps: true, collection: 'avaliacoes' }
);

// um usuário avalia cada filme uma única vez
avaliacaoSchema.index({ id_usuario: 1, id_filme: 1 }, { unique: true });

module.exports = model('Avaliacao', avaliacaoSchema);
