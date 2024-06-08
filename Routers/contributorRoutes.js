const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Contributor = require('../Model/contributor');

// @route   POST api/contributors
// @desc    Submit a request to become a contributor
// @access  Public
router.post(
  '/',
  [
    check('userName', 'Username is required').not().isEmpty(),
    check('userName', 'Username must be alphanumeric').isAlphanumeric(),
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userName, email, name } = req.body;

    try {
      // Check if username or email already exists
      let contributor = await Contributor.findOne({ userName });
      if (contributor) {
        return res.status(400).json({ errors: [{ msg: 'Username already exists' }] });
      }

      contributor = await Contributor.findOne({ email });
      if (contributor) {
        return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });
      }

      const newContributor = new Contributor({
        userName,
        email,
        name
      });

      const savedContributor = await newContributor.save();
      res.status(201).json(savedContributor);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET route to fetch all tags
router.get('/', async (req, res) => {
    try {
      const Contributors = await Contributor.find();
      res.json(Contributors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update contributor by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userName, email, name } = req.body;
    
    try {
      const contributor = await Contributor.findByIdAndUpdate(
        id,
        { userName, email, name },
        { new: true, runValidators: true }
      );
      if (!contributor) {
        return res.status(404).json({ error: 'Contributor not found' });
      }
      res.status(200).json(contributor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update contributor' });
    }
  });

  // DELETE contributor by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const contributor = await Contributor.findByIdAndDelete(id);
      if (!contributor) {
        return res.status(404).json({ error: 'Contributor not found' });
      }
      res.status(200).json({ message: 'Contributor deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete contributor' });
    }
  });
module.exports = router;
