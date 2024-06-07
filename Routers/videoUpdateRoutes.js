const express = require('express');
const router = express.Router();
const VideoUpdate = require('../Model/VideoUpdate'); // Adjust the path as necessary
const { body, validationResult } = require('express-validator');

// Route to update the video URL with validation
router.post('/update-video-url', [
 // Validate that videoUrl is a valid URL
 body('videoUrl').isURL().withMessage('Invalid URL format.')
], async (req, res) => {
 const errors = validationResult(req);
 if (!errors.isEmpty()) {
    // Map the errors to an array of error messages
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({ errors: errorMessages });
 }

 const { videoUrl } = req.body;
 console.log(videoUrl);

 try {
    // Create a new video update document
    const videoUpdate = new VideoUpdate({ videoUrl });
    await videoUpdate.save();

    res.status(200).send('Video URL updated successfully.');
 } catch (error) {
    console.error('Error updating video URL:', error);
    res.status(500).json({ error: 'An error occurred while updating the video URL.' });
 }
});

// Route to fetch the last video URL added to the database
// Route to fetch all video URLs added to the database
router.get('/latest-video-url', async (req, res) => {
   try {
      // Fetch all video URLs added to the database
      const allVideoUpdates = await VideoUpdate.find();
  
      if (!allVideoUpdates || allVideoUpdates.length === 0) {
        return res.status(404).json({ error: 'No video URLs found.' });
      }
  
      // Map the video updates to an array of video URLs
      const videoUrls = allVideoUpdates.map(update => update.videoUrl);
  
      res.status(200).json({ videoUrls });
   } catch (error) {
      console.error('Error fetching all video URLs:', error);
      res.status(500).json({ error: 'An error occurred while fetching all video URLs.' });
   }
  });
module.exports = router;