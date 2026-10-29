const { Schema, model } = require('mongoose');

// "desconto" é um PERCENTUAL (ex.: 10 = 10% de desconto)
const cupomSchema = new Schema(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    desconto: {
      type: Number,
      required: true,
      min: [0.01, 'O desconto deve ser maior que zero.'],
      max: [100, 'O desconto não pode passar de 100%.'],
    },
  },
  { timestamps: true, collection: 'cupons' }
);

module.exports = model('Cupom', cupomSchema);
