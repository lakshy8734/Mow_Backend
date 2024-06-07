// utils/multerConfig.js
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.originalUrl);
    if (req.originalUrl.includes("/api/doctors")) {
        console.log("hello");
     cb(null, "uploads/doctors/");
    }else if (req.originalUrl.includes('/api/blogs')) {
        console.log("world");
        cb(null, "uploads/blogs/");
    } else {
        return cb(new Error('Invalid upload path'));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
