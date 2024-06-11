const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Link = require('../Model/links');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Validation rules
const linkValidationRules = [
  check('name').not().isEmpty().withMessage('Name is required'),
  check('link').isURL().withMessage('Valid URL is required'),
  check('userId').not().isEmpty().withMessage('User ID is required')
];

const putlinkValidationRules = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('link').isURL().withMessage('Valid URL is required'),
    check('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ];

// GET all links
router.get('/', async (req, res) => {
  try {
    const links = await Link.find();
    res.json(links);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// GET all active links
router.get('/isActive', async (req, res) => {
  try {
    const activeLinks = await Link.find({ isActive: true });
    res.json(activeLinks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});


// POST add a new link
router.post('/addlink', linkValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, link, userId } = req.body;
  const date = moment().format('DD/MM/YYYY HH:mm:ss');
  const linkId = uuidv4();

  try {
    const newLink = new Link({ name, link, date, userId, linkId });
    await newLink.save();
    console.log('Link added:', newLink);
    res.status(201).json(newLink);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add link' });
  }
});

// PUT edit a link
router.put('/editlink/:linkId', putlinkValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { linkId } = req.params;
  const { name, link, isActive } = req.body;

  try {
    const updatedLink = await Link.findOneAndUpdate(
      { linkId },
      { name, link, isActive },
      { new: true }
    );

    if (!updatedLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    console.log('Link updated:', updatedLink);
    res.json(updatedLink);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// DELETE a link
router.delete('/:linkId', async (req, res) => {
  const { linkId } = req.params;

  try {
    const deletedLink = await Link.findOneAndDelete({ linkId });

    if (!deletedLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    console.log('Link deleted:', linkId);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

module.exports = router;
