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

module.exports = router;
