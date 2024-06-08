const express = require("express");
const { body, validationResult } = require("express-validator");
const { nanoid } = require("nanoid");
const moment = require("moment");
const Category = require("../Model/category");

const router = express.Router();

// GET /api/category/:id
router.get("/category/:categoryId", async (req, res) => {
  try {
    console.log(req.params.categoryId);
    const category = await Category.findOne(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

// DELETE route to delete a category by ID
router.delete("/editcategory/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findOneAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/editcategory/:categoryId",
  [
    body("name").notEmpty().withMessage("Category Name is required"),
    body("slug")
      .notEmpty()
      .withMessage("Slug is required")
      .custom(async (value, { req }) => {
        const existingCategory = await Category.findOne({
          slug: value,
          categoryId: { $ne: req.params.categoryId },
        });
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
      const category = await Category.findOne({ categoryId: req.params.categoryId });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check if a category with the same name already exists (excluding the current category)
      const existingCategoryName = await Category.findOne({
        categoryName: name,
        categoryId: { $ne: req.params.categoryId },
      });
      if (existingCategoryName) {
        return res.status(400).json({ error: "Category name must be unique" });
      }

      // Check if a category with the same slug already exists (excluding the current category)
      const existingSlug = await Category.findOne({
        slug: slug,
        categoryId: { $ne: req.params.categoryId },
      });
      if (existingSlug) {
        return res.status(400).json({ error: "Slug must be unique" });
      }

      category.categoryName = name;
      category.slug = slug;
      category.description = description;
      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


module.exports = router;
