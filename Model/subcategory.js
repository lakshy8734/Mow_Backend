const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  subcategoryName: { type: String, required: true },
  subcategoryId: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: String, required: true } // Adding createdAt field
});

module.exports = mongoose.model("Subcategory", subcategorySchema);
