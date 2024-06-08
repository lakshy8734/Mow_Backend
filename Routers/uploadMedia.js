const express = require("express");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const multer = require("multer");
const sharp = require("sharp");

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

const router = express.Router();

// Function to get the current date and time formatted as "DD-MM-YYYY_HH-MM"
const getCurrentFormattedDateTime = () => {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const formattedDate = `${day}-${month}-${year}`;
  const formattedTime = `${hours}-${minutes}`;
  return `${formattedDate}`;
};

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const file = req.file;
    const currentFolderName = getCurrentFormattedDateTime();
    console.log(currentFolderName);

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

    // Compress the image using sharp
    const compressedImageBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // Resize the image to a width of 800px
      .jpeg({ quality: 80 }) // Compress the image with 80% quality
      .toBuffer();

    const storageRef = ref(storage, `Blogs/${currentFolderName}/${uniqueFilename}`);
    await uploadBytes(storageRef, compressedImageBuffer);

    const downloadURL = await getDownloadURL(storageRef);
    res.status(200).json({ url: downloadURL });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ error: "Failed to upload media." });
  }
});

module.exports = router;
