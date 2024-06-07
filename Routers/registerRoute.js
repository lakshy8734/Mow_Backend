const express = require("express");
const Router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 
const { body, validationResult } = require("express-validator");
const user = require("../Model/register");

// Assuming you have a route for fetching user details
Router.get(
  "/user/:userId",
  async (req, res) => {
    const { userId } = req.params;
    console.log(userId);

    try {
      // Fetch the user from the database using the userId
      const User = await user.findOne({userId : userId });
      if (!User) {
        return res.status(404).json({ Message: "User not found" });
      }

      // Send back the user details
      res.status(200).json({
        Message: "User details fetched successfully",
        name: User.name,
        username: User.username,
        email: User.email,
        profilePicture: User.profilePicture,
      });
    } catch (error) {
      console.error("Error fetching user:", error.message, error.stack);
      res.status(500).json({ Message: "Internal Server Error", error: error.message });
    }
  }
);

// Register route with validation
Router.post(
  "/register",
  body("name").isLength({ min: 1 }).withMessage("Name is required"),
  body("email")
 .isEmail()
 .withMessage("Email is not valid")
 .custom(async (email) => {
      const userExist = await user.findOne({ email: email });
      if (userExist) {
        throw new Error("Email already exists");
      }
      return true;
    }),
  body("username")
 .isLength({ min: 1 })
 .withMessage("Username is required")
 .custom(async (username) => {
      const userExist = await user.findOne({ username: username });
      if (userExist) {
        throw new Error("Username already exists");
      }
      return true;
    }),
  body("password")
 .isLength({ min: 4 })
 .withMessage("Password must be at least 4 characters long"),
  async (req, res) => {
    console.log("hi1");
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("hi1");
      const { name, email, username, password } = req.body;
      const hashpassword = await bcrypt.hash(password, 10);

      const newUser = await user.create({
        name,
        email,
        username,
        password: hashpassword,
      });

      newUser.save();

      res.status(201).json({
        Message: "User created successfully",
        name: name,
        username: username,
      });
    } catch (error) {
      console.error(error);
      res
     .status(500)
     .json({ Message: "Internal Server Error at register side" });
    }
  }
);

// Login route with validation and token generation
// Login route with validation and token generation
Router.post(
  "/login",
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
  .isLength({ min: 4 })
  .withMessage("Password must be at least 8 characters long"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      let User = await user.findOne({ email: email });
      if (!User) {
        return res.status(409).json({ Message: "Invalid Credential" });
      }

      let passwordMatch = await bcrypt.compare(password, User.password);
      if (!passwordMatch) {
        return res
      .status(409)
      .json({ Message: "Invalid Credential", success: false });
      }

      // Generate a token
      const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
        expiresIn: 86400, // expires in 24 hours
      });

      // Include userId in the response
      res.status(200).json({
        Message: "User Logged in successfully",
        name: User.name,
        username: User.username,
        email: User.email,
        userId: User.userId, // Include userId in the response
        success: true,
        token: token, // send the token to the client
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Message: "Internal Server Error at login side" });
    }
  }
);

// Google login route
Router.post(
  "/login/google",
  async (req, res) => {
    const { email, name, picture } = req.body;

    try {
      // Check if the user exists by email
      let User = await user.findOne({ email: email });
      if (!User) {
        // If the user does not exist, create a new user
        const username = name; // Use the name as the username
        const password = generateRandomPassword(); // Generate a random strong password
        const hashpassword = await bcrypt.hash(password, 10);

        // Create a new user with the provided name, email, username, and hashed password
        User = await user.create({
          name,
          email,
          username,
          password: hashpassword,
          profilePicture: picture || 'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=', // Use the provided picture or default
        });

        // Generate a token for the new user
        const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
          expiresIn: 86400, // expires in 24 hours
        });

        res.status(201).json({
          Message: "User created and logged in successfully",
          name: name,
          username: username,
          email: email,
          profilePicture: picture || 'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=', // Send the profile picture
          userId: User.userId,
          success: true,
          token: token, // Send the token to the client
        });
      } else {
        // If the user exists, update the profile picture if provided, otherwise use the default
        User.profilePicture = picture || 'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=';
        await User.save();

        // Generate a token for the existing user
        const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
          expiresIn: 86400, // expires in 24 hours
        });

        res.status(200).json({
          Message: "User logged in successfully",
          name: User.name,
          username: User.username,
          email: User.email,
          profilePicture: User.profilePicture,
          userId: User.userId,
          success: true,
          token: token, // Send the token to the client
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ Message: "Internal Server Error at Google login side" });
    }
  }
);

// Function to generate a random and strong password
function generateRandomPassword() {
  const length = 12; // You can adjust the length of the password
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+~`|}{[]\:;"<>,.?/';
  let password = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

module.exports = Router;