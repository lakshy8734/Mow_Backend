const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: String, required: true }, // Add createdAt field
});

module.exports = mongoose.model("Category", categorySchema);
