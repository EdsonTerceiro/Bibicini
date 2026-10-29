const { Schema, model } = require('mongoose');

const generoSchema = new Schema(
  { nome: { type: String, required: true, unique: true, trim: true, maxlength: 50 } },
  { timestamps: true, collection: 'generos' }
);

module.exports = model('Genero', generoSchema);
