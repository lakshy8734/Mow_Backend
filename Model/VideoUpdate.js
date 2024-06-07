const mongoose = require('mongoose');

const videoUpdateSchema = new mongoose.Schema({
 videoUrl: {
    type: String,
    required: true,
 },
 updatedAt: {
    type: Date,
    default: Date.now,
 },
});

const VideoUpdate = mongoose.model('VideoUpdate', videoUpdateSchema);

module.exports = VideoUpdate;