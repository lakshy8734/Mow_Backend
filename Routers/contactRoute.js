const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Contact = require('../Model/contact');


router.delete('/:contactId', async (req, res) => {
    const { contactId } = req.params;
  
    try {
      const deletedContact = await Contact.findOneAndDelete({ contactId });
  
      if (!deletedContact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
  
      console.log('Contact deleted:', contactId);
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  });
  

// GET all links
router.get('/', async (req, res) => {
    try {
      const contact = await Contact.find();
      res.json(contact);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  });

// POST /api/contact
router.post('/',
  [
    check('name')
      .not().isEmpty().withMessage('Name is required')
      .matches(/^[A-Za-z\s]+$/).withMessage('Name should only contain alphabets and spaces'),
    check('email')
      .isEmail().withMessage('Please include a valid email'),
    check('subject')
      .not().isEmpty().withMessage('Subject is required')
      .isLength({ max: 50 }).withMessage('Subject should be within 50 words'),
    check('message')
      .not().isEmpty().withMessage('Message is required')
      .isLength({ max: 200 }).withMessage('Message should be within 200 words')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    try {
      let contact = new Contact({
        name,
        email,
        subject,
        message
      });

      await contact.save();
      res.status(200).json({ msg: 'Message sent successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
