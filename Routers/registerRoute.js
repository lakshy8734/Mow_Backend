const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const register = require("../Model/register"); // Updated model import
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const multer = require("multer");
const sharp = require("sharp");

const Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const getCurrentFormattedDateTime = () => {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  const formattedDate = `${day}_${month}_${year}`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  return `${formattedDate}`;
};

const getLastLoggingTime = () => {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  const formattedDate = `${day}_${month}_${year}`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  return `${formattedDate} ${formattedTime}`;
};

const uploadImageToFirebase = async (file) => {
  const currentFolderName = getCurrentFormattedDateTime();
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  const formattedTime = currentDate
    .toTimeString()
    .split(" ")[0]
    .replace(/:/g, "-");
  const uniqueFilename = `${formattedDate}_${formattedTime}_${file.originalname}`;

  const compressedImageBuffer = await sharp(file.buffer)
    .resize({ width: 800 }) // Resize the image to a width of 800px
    .jpeg({ quality: 80 }) // Compress the image with 80% quality
    .toBuffer();

  const storageRef = ref(
    storage,
    `user/${currentFolderName}/${uniqueFilename}`
  );
  await uploadBytes(storageRef, compressedImageBuffer);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

// DELETE route to delete a tag by ID
Router.delete("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await register.findOneAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user profile route
Router.put(
  "/user/:userId",
  upload.single("profilePicture"),
  body("name").optional().isLength({ min: 1 }).withMessage("Name is required"),
  body("email").optional().isEmail().withMessage("Email is not valid"),
  body("username")
    .optional()
    .isLength({ min: 1 })
    .withMessage("Username is required"),
  body("role")
    .optional()
    .isIn(["User", "Admin", "Subadmin"])
    .withMessage("Invalid role"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { name, email, username, role, password } = req.body;

    try {
      const user = await register.findOne({ userId });

      if (!user) {
        return res.status(404).json({ Message: "User not found" });
      }

      console.log("Updating user:", userId);

      // Update fields only if they are present in the request
      if (name) {
        console.log("Updating name:", name);
        user.name = name;
      }

      if (email) {
        console.log("Updating email:", email);
        user.email = email;
      }

      if (username) {
        console.log("Updating username:", username);
        user.username = username;
      }

      if (role) {
        console.log("Updating role:", role);
        user.role = role;
      }

      if (password) {
        console.log("Updating password");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
      }

      if (req.file) {
        console.log("Updating profile picture");
        const profilePictureUrl = await uploadImageToFirebase(req.file);
        user.profilePicture = profilePictureUrl;
      }

      await user.save();
      console.log("User updated successfully:", user);
      res.json({ user });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ Message: "Server error" });
    }
  }
);

// Register route with validation
Router.post(
  "/register",
  upload.single("profilePicture"),
  body("name").isLength({ min: 1 }).withMessage("Name is required"),
  body("email")
    .isEmail()
    .withMessage("Email is not valid")
    .custom(async (email) => {
      const userExist = await register.findOne({ email: email }); // Use register model
      if (userExist) {
        throw new Error("Email already exists");
      }
      return true;
    }),
  body("username")
    .isLength({ min: 1 })
    .withMessage("Username is required")
    .custom(async (username) => {
      const userExist = await register.findOne({ username: username }); // Use register model
      if (userExist) {
        throw new Error("Username already exists");
      }
      return true;
    }),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long"),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, username, password, role } = req.body;
      const hashpassword = await bcrypt.hash(password, 10);

      let profilePictureUrl = "";
      if (req.file) {
        profilePictureUrl = await uploadImageToFirebase(req.file);
      }

      const newUser = await register.create({
        name,
        email,
        username,
        password: hashpassword,
        profilePicture: profilePictureUrl,
        role: role || "User", // Use provided role or default to "User"
        lastLoggingTime: getCurrentFormattedDateTime(),
      });

      newUser.save();

      res.status(201).json({
        Message: "User created successfully",
        name: name,
        username: username,
        profilePicture: profilePictureUrl,
        lastLoggingTime: newUser.lastLoggingTime,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ Message: "Internal Server Error at register side" });
    }
  }
);

// Fetch user details route
Router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(userId);

  try {
    // Fetch the user from the database using the userId
    const User = await register.findOne({ userId: userId }); // Use register model
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
      role: User.role,
    });
  } catch (error) {
    console.error("Error fetching user:", error.message, error.stack);
    res
      .status(500)
      .json({ Message: "Internal Server Error", error: error.message });
  }
});

// Login route with validation and token generation
Router.post(
  "/login",
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      let User = await register.findOne({ email: email }); // Use register model
      if (!User) {
        return res.status(409).json({ Message: "Invalid Credential" });
      }

      let passwordMatch = await bcrypt.compare(password, User.password);
      if (!passwordMatch) {
        return res
          .status(409)
          .json({ Message: "Invalid Credential", success: false });
      }

      // Update the lastLoggingTime field
      User.lastLoggingTime = getLastLoggingTime();
      await User.save();

      // Generate a token
      const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      console.log(User.userId);

      // Include userId and role in the response
      res.status(200).json({
        Message: "User Logged in successfully",
        user: {
          name: User.name,
          username: User.username,
          email: User.email,
          userId: User.userId, // Include userId in the response
          profilePicture: User.profilePicture,
          lastLoggingTime: User.lastLoggingTime, // Include the lastLoggingTime in the response
          role: User.role, // Include the role in the response
        },
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
Router.post("/login/google", async (req, res) => {
  const { email, name, picture, role } = req.body;

  try {
    // Check if the user exists by email
    let User = await register.findOne({ email: email }); // Use register model
    if (!User) {
      // If the user does not exist, create a new user
      const username = name; // Use the name as the username
      const password = generateRandomPassword(); // Generate a random strong password
      const hashpassword = await bcrypt.hash(password, 10);

      // Create a new user with the provided name, email, username, and hashed password
      User = await register.create({
        name,
        email,
        username,
        password: hashpassword,
        profilePicture:
          picture ||
          "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=",
        role: role || "User", // Use provided role or default to "User"
      });

      // Update the lastLoggingTime field
      User.lastLoggingTime = getLastLoggingTime();
      await User.save();

      // Generate a token for the new user
      const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // expires in 24 hours
      });

      console.log(User.userId);

      res.status(201).json({
        Message: "User created and logged in successfully",
        user: {
          name: name,
          username: username,
          email: email,
          profilePicture:
            picture ||
            "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=", // Send the profile picture
          userId: User.userId,
          lastLoggingTime: User.lastLoggingTime, // Include the lastLoggingTime in the response
          role: User.role, // Include the role in the response
        },
        success: true,
        token: token, // Send the token to the client
      });
    } else {
      // If the user exists, update the profile picture if provided, otherwise use the default
      User.profilePicture =
        picture ||
        "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";

      // Update the lastLoggingTime field
      User.lastLoggingTime = getLastLoggingTime();
      await User.save();

      // Generate a token for the existing user
      const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // expires in 24 hours
      });

      console.log(User.userId);

      res.status(200).json({
        Message: "User logged in successfully",
        user: {
          name: User.name,
          username: User.username,
          email: User.email,
          profilePicture: User.profilePicture,
          userId: User.userId,
          lastLoggingTime: User.lastLoggingTime, // Include the lastLoggingTime in the response
          role: User.role, // Include the role in the response
        },
        success: true,
        token: token, // Send the token to the client
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ Message: "Internal Server Error at Google login side" });
  }
});

// Function to generate a random and strong password
function generateRandomPassword() {
  const length = 12; // You can adjust the length of the password
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+~`|}{[]:;"<>,.?/';
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

// GET route to fetch all users with role "SubAdmin"
Router.get("/subadmin", async (req, res) => {
  try {
    // Query the database to find users with the role "SubAdmin"
    const subAdminUsers = await register.find({ role: "SubAdmin" });
    res.json(subAdminUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route to fetch all tags
Router.get("/", async (req, res) => {
  try {
    const users = await register.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = Router;
