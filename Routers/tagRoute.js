const express = require('express');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const Tag = require('../Model/tag');
const moment = require("moment");

const router = express.Router();

// GET /api/tag/:id
router.get('/tag/:tagId', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.tagId);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST route to create a new tag
router.post(
  '/',
  [
    body('tagName').notEmpty().withMessage('Tag Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('slug').notEmpty().withMessage('Slug is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { tagName, description, slug } = req.body;

      // Check if a tag with the same tagName already exists
      const existingTag = await Tag.findOne({ tagName });
      if (existingTag) {
        return res.status(400).json({ error: "Tag name must be unique" });
      }

      // Check if a tag with the same slug already exists
      const existingSlug = await Tag.findOne({ slug });
      if (existingSlug) {
        return res.status(400).json({ error: "Slug must be unique" });
      }

      const tagId = nanoid();
      const createdAt = moment().format("DD/MM/YYYY HH:mm:ss");
      const newTag = new Tag({ tagName, tagId, description, slug, createdAt });
      await newTag.save();
      res.status(201).json(newTag);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET route to fetch all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
