const express = require("express");
const { body, validationResult } = require("express-validator");
const { nanoid } = require("nanoid");
const Blog = require("../Model/blog");
const moment = require("moment");

const router = express.Router();
const deleteComment = (comments, commentId) => {
  let deleted = false;

  for (let i = 0; i < comments.length; i++) {
    if (comments[i].commentId === commentId) {
      comments.splice(i, 1);
      deleted = true;
      break;
    }
    const { deleted: childDeleted } = deleteComment(
      comments[i].replies,
      commentId
    );
    if (childDeleted) {
      deleted = true;
      break;
    }
  }

  return { deleted };
};

const findComment = (comments, commentId) => {
  for (const comment of comments) {
    if (comment.commentId === commentId) {
      return comment;
    }
    const found = findComment(comment.replies, commentId);
    if (found) {
      return found;
    }
  }
  return null;
};

const findParentAndAddReply = (comments, parentCommentId, newReply) => {
  for (const comment of comments) {
    if (comment.commentId === parentCommentId) {
      comment.replies.push(newReply);
      return true;
    }
    if (findParentAndAddReply(comment.replies, parentCommentId, newReply)) {
      return true;
    }
  }
  return false;
};

router.post("/:blogId/comments", async (req, res) => {
  const { content, author, parentCommentId } = req.body;

  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const commentId = nanoid();
    const createdAt = moment().format("DD/MM/YYYY HH:mm:ss");
    const newComment = {
      commentId,
      content,
      author,
      createdAt,
      parentCommentId,
      replies: [],
    };

    if (parentCommentId) {
      if (!findParentAndAddReply(blog.comments, parentCommentId, newComment)) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    } else {
      blog.comments.push(newComment);
    }

    await blog.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment", error });
  }
});


router.get("/:blogId/comments", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments", error });
  }
});


router.delete("/:blogId/comments/:commentId", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const { deleted } = deleteComment(blog.comments, req.params.commentId);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await blog.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment", error });
  }
});

// GET route to fetch blogs by subcategoryid
router.get("/:subcategoryId", async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    const blogs = await Blog.find({ subcategoryId });
    console.log(blogs);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// POST route to create a new blog
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
    body("mediaUrl").notEmpty().withMessage("Media URL is required"),
    body("categoryId").notEmpty().withMessage("Category is required"),
    body("subcategoryId").notEmpty().withMessage("Subcategory is required"),
    body("tagIds").isArray().withMessage("Tags must be an array"),
    body("tagIds").custom((value) => {
      if (!value || value.length === 0) {
        throw new Error("At least one tag is required");
      }
      return true;
    }),
    body("authorName").notEmpty().withMessage("Author Name is required"),
    body("slug").notEmpty().withMessage("Slug is required"),
    // Additional validation
    body("slug").custom(async (value) => {
      const existingBlog = await Blog.findOne({ slug: value });
      if (existingBlog) {
        throw new Error("Slug already exists");
      }
    }),
    body("mediaUrl").custom(async (value) => {
      const existingBlog = await Blog.findOne({ mediaUrl: value });
      if (existingBlog) {
        throw new Error("Media URL already exists");
      }
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        content,
        mediaUrl,
        categoryId,
        subcategoryId,
        tagIds,
        authorName,
        slug,
      } = req.body;

      // Ensure non-null values for categoryId and subcategoryId
      if (!categoryId || !subcategoryId) {
        return res
          .status(400)
          .json({ error: "Category and Subcategory are required" });
      }

      const blogId = nanoid();
      const createdAt = moment().format("DD/MM/YYYY HH:mm:ss");
      const newBlog = new Blog({
        title,
        blogId,
        content,
        mediaUrl,
        categoryId,
        subcategoryId,
        tagIds,
        authorName,
        slug,
        createdAt,
      });
      await newBlog.save();
      res.status(201).json(newBlog);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  }
);

// GET route to fetch all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// Example using Express.js
router.get("/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const blog = await Blog.findOne({ slug }); // Adjust this line according to your ORM/Database
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET a blog by blogId
router.get("/currentblog/:blogId", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Increment view count
router.post("/:blogId/view", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.incrementViewCount();
    res.json({ message: "View count incremented successfully", blog });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ message: "Error incrementing view count", error });
  }
});

// Increment like count
router.post("/:blogId/like", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.incrementLikeCount();
    res.json({ message: "Like count incremented successfully", blog });
  } catch (error) {
    console.error("Error incrementing like count:", error);
    res.status(500).json({ message: "Error incrementing like count", error });
  }
});

// Decrement like count
router.post("/:blogId/unlike", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.decrementLikeCount();
    res.json({ message: "Like count decremented successfully", blog });
  } catch (error) {
    console.error("Error decrementing like count:", error);
    res.status(500).json({ message: "Error decrementing like count", error });
  }
});

module.exports = router;
