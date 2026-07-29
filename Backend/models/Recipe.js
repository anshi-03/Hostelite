const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const RecipeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  ingredients: { type: String, required: true },
  steps:       { type: String, required: true },
  mediaUrl:    { type: String, required: true },   // ImageKit URL
  mediaType:   { type: String, enum: ['image', 'video'], required: true },
  fileId:      { type: String },                   // ImageKit fileId for deletion
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:    [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);