const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  tagName: { type: String, required: true, unique: true },
  tagId: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }, // Add slug field
  description: { type: String },
  createdAt: { type: String, required: true } // Adding createdAt field
});

module.exports = mongoose.model('Tag', tagSchema);
