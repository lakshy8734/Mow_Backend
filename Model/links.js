const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  date: { type: String, required: true },
  userId: { type: String, required: true },
  linkId: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Link', linkSchema);
