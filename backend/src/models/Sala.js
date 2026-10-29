const { Schema, model } = require('mongoose');

// SALA (1) POSSUI (N) ASSENTO -> assentos embutidos (cada um recebe seu próprio _id)
const assentoSchema = new Schema({
  fileira: { type: String, required: true, uppercase: true, trim: true, maxlength: 2 },
  numero: { type: Number, required: true, min: 1, validate: Number.isInteger },
});

const salaSchema = new Schema(
  {
    numero: { type: Number, required: true, unique: true, min: 1, validate: Number.isInteger },
    capacidade: { type: Number, required: true, min: 1, validate: Number.isInteger },
    assentos: {
      type: [assentoSchema],
      default: [],
      validate: {
        validator(lista) { return lista.length <= this.capacidade; },
        message: 'A quantidade de assentos não pode ultrapassar a capacidade da sala.',
      },
    },
  },
  { timestamps: true, collection: 'salas' }
);

module.exports = model('Sala', salaSchema);
