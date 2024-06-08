const express = require("express");
const { body, validationResult } = require("express-validator");
const { nanoid } = require("nanoid");
const moment = require("moment");
const Subcategory = require("../Model/subcategory");

const router = express.Router();

// GET /api/subcategory/:id
router.get('/subcategory/:subcategoryId', async (req, res) => {
  try {
    const subcategory = await Subcategory.findOne(req.params.subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Subcategory Name is required"),
    body("categoryId").notEmpty().withMessage("Category ID is required"),
    body("slug").notEmpty().withMessage("Slug is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, categoryId, slug, description } = req.body;
      const subcategoryId = nanoid();
      const createdAt = moment().format("DD/MM/YYYY HH:mm:ss"); // Format the date and time
      const newSubcategory = new Subcategory({
        subcategoryName: name,
        subcategoryId,
        categoryId,
        slug,
        description,
        createdAt,
      });
      await newSubcategory.save();
      res.status(201).json(newSubcategory);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const subcategories = await Subcategory.find();
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT route to edit a subcategory by ID
router.put(
  "/editcategory/:subcategoryId",
  [
    body("name").notEmpty().withMessage("Subcategory Name is required"),
    body("categoryId").notEmpty().withMessage("Category ID is required"),
    body("slug").notEmpty().withMessage("Slug is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, categoryId, slug, description } = req.body;
      const subcategory = await Subcategory.findOne({ subcategoryId: req.params.subcategoryId });
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      // Check if a subcategory with the same name already exists (excluding the current subcategory)
      const existingSubcategoryName = await Subcategory.findOne({
        subcategoryName: name,
        subcategoryId: { $ne: req.params.subcategoryId },
      });
      if (existingSubcategoryName) {
        return res.status(400).json({ error: "Subcategory name must be unique" });
      }

      // Check if a subcategory with the same slug already exists (excluding the current subcategory)
      const existingSlug = await Subcategory.findOne({
        slug: slug,
        subcategoryId: { $ne: req.params.subcategoryId },
      });
      if (existingSlug) {
        return res.status(400).json({ error: "Slug must be unique" });
      }

      subcategory.subcategoryName = name;
      subcategory.categoryId = categoryId;
      subcategory.slug = slug;
      subcategory.description = description;
      const updatedSubcategory = await subcategory.save();
      res.json(updatedSubcategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE route to delete a subcategory by ID
router.delete("/editcategory/:subcategoryId", async (req, res) => {
  try {
    const subcategory = await Subcategory.findOneAndDelete({ subcategoryId: req.params.subcategoryId });
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
