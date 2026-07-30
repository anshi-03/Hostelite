const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('savedRecipes');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/users/save/:recipeId  — toggle save
router.put('/save/:recipeId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = user.savedRecipes.findIndex(id => id.toString() === req.params.recipeId);

    if (idx === -1) user.savedRecipes.push(req.params.recipeId);
    else user.savedRecipes.splice(idx, 1);

    await user.save();
    res.json({ saved: idx === -1, savedRecipes: user.savedRecipes });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;