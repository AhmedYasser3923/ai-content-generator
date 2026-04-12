const express = require('express');
const router  = express.Router();

const Post = require('../models/Post');
const { generateResearch, generatePost, generateImagePrompt, generateIdea } = require('../services/claudeService');
const { generateImage } = require('../services/imageService');

/**
 * POST /api/generate
 * Body: { idea?, tone, platform }
 * Returns: { _id, research, post, imageUrl }
 */
router.post('/', async (req, res, next) => {
  try {
    let { idea, tone = 'professional', platform = 'linkedin' } = req.body;

    // ── 1. Auto-generate idea if blank ──────────────────────
    if (!idea || idea.trim() === '') {
      console.log('💡 No idea provided — auto-generating...');
      idea = await generateIdea();
      console.log('💡 Generated idea:', idea);
    }

    console.log(`\n📝 Generating content for: "${idea}" [${tone}] [${platform}]`);

    // ── 2. Run research + post generation in parallel ────────
    const [research, ] = await Promise.all([
      generateResearch(idea),
    ]);

    const post = await generatePost(idea, tone, platform, research);

    // ── 3. Generate image prompt → image ────────────────────
    let imageUrl = '';
    try {
      const imagePrompt = await generateImagePrompt(idea, post);
      console.log('🎨 Image prompt:', imagePrompt);
      imageUrl = await generateImage(imagePrompt) || '';
    } catch (imgErr) {
      // Image failure is non-fatal — log and continue
      console.warn('⚠️  Image generation failed:', imgErr.message);
    }

    // ── 4. Save to MongoDB ───────────────────────────────────
    const saved = await Post.create({
      idea,
      tone,
      platform,
      research,
      post,
      imageUrl,
      status     : 'draft',
      promptUsed : idea,
    });

    console.log(`✅ Post saved to DB [${saved._id}]`);

    // ── 5. Return to frontend ────────────────────────────────
    res.json({
      _id     : saved._id,
      research: saved.research,
      post    : saved.post,
      imageUrl: saved.imageUrl,
      idea    : saved.idea,
      tone    : saved.tone,
      platform: saved.platform,
      createdAt: saved.createdAt,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
