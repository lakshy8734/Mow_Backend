const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: uuidv4, // Generate a UUID when a new document is created
    unique: true, // Ensure the userId is unique across all documents
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true, // Ensure the username is unique across all users
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=', // Default profile picture URL
  },
  role: {
    type: String,
    required: true,
  },
  lastLoggingTime: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
