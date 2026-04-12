const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');
const { generateImagePrompt } = require('../services/claudeService');
const { generateImage }       = require('../services/imageService');

/**
 * POST /api/regenerate-image
 * Body: { postId?, idea, post }
 * Returns: { imageUrl }
 */
router.post('/', async (req, res, next) => {
  try {
    const { postId, idea, post } = req.body;

    if (!idea && !post) {
      return res.status(400).json({ error: 'idea or post content is required' });
    }

    // ── 1. Build image prompt via Claude ────────────────────
    const imagePrompt = await generateImagePrompt(
      idea || 'business and technology',
      post || ''
    );

    console.log('🎨 Regenerating image with prompt:', imagePrompt);

    // ── 2. Generate image ────────────────────────────────────
    const imageUrl = await generateImage(imagePrompt);

    if (!imageUrl) {
      return res.status(502).json({ error: 'Image provider returned no URL' });
    }

    // ── 3. Update DB record if postId provided ───────────────
    if (postId) {
      await Post.findByIdAndUpdate(postId, { imageUrl });
      console.log(`🖼️  Image updated in DB [${postId}]`);
    }

    res.json({ imageUrl });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
