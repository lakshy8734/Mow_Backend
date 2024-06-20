const mongoose = require("mongoose");
const { Schema } = mongoose;

const replySchema = new Schema({
  commentId: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: String, required: true },
  parentCommentId: { type: String, default: null },
  replies: { type: [this], default: [] }, // Self-referencing for nested replies
  userId: { type: String },
  userName: { type: String},
  userProfilePicture: { type: String },
});

const commentSchema = new Schema({
  commentId: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: String, required: true },
  parentCommentId: { type: String, default: null },
  replies: { type: [replySchema], default: [] }, // Embedding replies within comments
  userId: { type: String},
  userName: { type: String},
  userProfilePicture: { type: String },
});

const blogSchema = new Schema({
  blogId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  categoryId: { type: String, required: true },
  subcategoryId: { type: String, required: true },
  tagIds: { type: [String], required: true },
  authorName: { type: String, required: true },
  slug: { type: String, required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  userId: { type: String, required: true},
  createdAt: { type: String, required: true },
  comments: { type: [commentSchema], default: [] }, // Embedding comments within blog
  publish: { type: Boolean, default: false },
});

// Method to increment views
blogSchema.methods.incrementViewCount = async function () {
  this.views += 1;
  await this.save();
};

// Method to increment likes
blogSchema.methods.incrementLikeCount = async function () {
  this.likes += 1;
  await this.save();
};

// Method to decrement likes
blogSchema.methods.decrementLikeCount = async function () {
  this.likes -= 1;
  await this.save();
};

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
