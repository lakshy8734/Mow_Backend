const express = require("express");
const { body, validationResult } = require("express-validator");
const { nanoid } = require("nanoid");
const moment = require("moment");
const Category = require("../Model/category");

const router = express.Router();

// GET /api/category/:id
router.get('/category/:categoryId', async (req, res) => {
  try {
    console.log(req.params.categoryId);
    const category = await Category.findOne(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST route to create a new category
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Category Name is required"),
    body("slug")
      .notEmpty()
      .withMessage("Slug is required")
      .custom(async (value) => {
        const existingCategory = await Category.findOne({ slug: value });
        if (existingCategory) {
          throw new Error("Slug must be unique");
        }
        return true;
      }),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, slug, description } = req.body;
      const categoryId = nanoid();
      const createdAt = moment().format("DD/MM/YYYY HH:mm:ss"); // Format the date and time
      const newCategory = new Category({
        categoryName: name,
        slug,
        categoryId,
        description,
        createdAt,
      });
      await newCategory.save();
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET route to fetch all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
