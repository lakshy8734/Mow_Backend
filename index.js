const express = require("express");
const db = require("./Config/DB");
const cors = require("cors");
const registerRoutes = require("./Routers/registerRoute");
const passwordResetRoutes = require("./Routers/passwordResetRoutes");
const videoUpdateRoutes = require("./Routers/videoUpdateRoutes");
const categoryRoutes = require("./Routers/categoryRoute");
const subcategoryRoutes = require("./Routers/subcategoryRoute");
const tagRoutes = require("./Routers/tagRoute");
const blogRoutes = require("./Routers/blogRoute");
const uploadMedia = require("./Routers/uploadMedia");
const contributorRoutes = require('./Routers/contributorRoutes');
const linkRoute = require('./Routers/linkRoute');
const contactRoute = require('./Routers/contactRoute');

require("dotenv").config();
const app = express();

app.use(express.json({ limit: '10mb' })); // Increase payload size limit
app.use(
  cors({
    origin: process.env.FRONTEND_DOMAIN,
  })
);
db();

app.get("/", (req, res) => {
  res.send("Welcome to the server");
});

app.use("/api", registerRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", videoUpdateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/blog', blogRoutes);
app.use('/uploadmedia', uploadMedia);
app.use('/api/contributors', contributorRoutes);
app.use('/api/links', linkRoute);
app.use('/api/contact', contactRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
