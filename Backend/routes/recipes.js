const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const axios     = require('axios');
const FormData  = require('form-data');
const auth      = require('../middleware/auth');
const Recipe    = require('../models/Recipe');
const User      = require('../models/User');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

async function uploadToImageKit(buffer, filename, mimeType) {
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimeType });
  form.append('fileName', filename);
  form.append('folder', '/hostelite');

  const response = await axios.post(
    'https://upload.imagekit.io/api/v1/files/upload',
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Basic ' + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64')
      }
    }
  );
  return response.data;
}

// GET /api/recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('author', 'firstname lastname')
      .populate('comments.user', 'firstname lastname')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'firstname lastname')
      .populate('comments.user', 'firstname lastname');
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/recipes
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const { title, description, ingredients, steps } = req.body;
    if (!req.file) return res.status(400).json({ msg: 'Media file required' });

    const mimeType  = req.file.mimetype;
    const mediaType = mimeType.startsWith('video') ? 'video' : 'image';
    const ikData    = await uploadToImageKit(req.file.buffer, req.file.originalname, mimeType);

    const recipe = new Recipe({
      title, description, ingredients, steps,
      mediaUrl:  ikData.url,
      fileId:    ikData.fileId,
      mediaType,
      author:    req.user.id
    });
    await recipe.save();
    await recipe.populate('author', 'firstname lastname');
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/recipes/:id  — only recipe author can delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    // Check ownership
    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorised to delete this recipe' });
    }

    // Delete from ImageKit if fileId exists
    if (recipe.fileId) {
      try {
        await axios.delete(`https://api.imagekit.io/v1/files/${recipe.fileId}`, {
          headers: {
            Authorization: 'Basic ' + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64')
          }
        });
      } catch (ikErr) {
        console.log('ImageKit delete failed (continuing):', ikErr.message);
      }
    }

    // Remove recipe from all users' savedRecipes
    await User.updateMany(
      { savedRecipes: recipe._id },
      { $pull: { savedRecipes: recipe._id } }
    );

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Recipe deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/recipes/:id/like
router.put('/:id/like', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    const idx = recipe.likes.indexOf(req.user.id);
    if (idx === -1) recipe.likes.push(req.user.id);
    else            recipe.likes.splice(idx, 1);

    await recipe.save();
    res.json({ likes: recipe.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/recipes/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    recipe.comments.push({ user: req.user.id, text: req.body.text });
    await recipe.save();
    await recipe.populate('comments.user', 'firstname lastname');

    const newComment = recipe.comments[recipe.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/recipes/:id/comment/:commentId
// Only the recipe AUTHOR can delete any comment on their recipe
router.delete('/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    // Only the recipe author can delete comments
    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the recipe author can delete comments' });
    }

    const commentIdx = recipe.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );
    if (commentIdx === -1) return res.status(404).json({ msg: 'Comment not found' });

    recipe.comments.splice(commentIdx, 1);
    await recipe.save();
    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;