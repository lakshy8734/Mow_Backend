// db.js
const mongoose = require("mongoose");
require("dotenv").config();

const db = async () => {
  try {
    console.log("Attempting to connect to MongoDB with URI:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = db;





// const mongoose = require('mongoose');

// const db = async function db() {
//     try {
//          await mongoose.connect('mongodb+srv://Lakshy_123:MOW@123@mowproject.65uqylm.mongodb.net/');
//         console.log('Connected to MongoDB'); 
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error); 
//     }
// }

// module.exports = db;