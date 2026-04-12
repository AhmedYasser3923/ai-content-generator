const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');

/**
 * POST /api/publish
 * Body: { postId?, post, imageUrl, platform }
 *
 * If postId is provided, updates that document.
 * Otherwise finds the most recent draft and marks it published.
 *
 * Returns: { success, message, _id, publishedAt }
 */
router.post('/', async (req, res, next) => {
  try {
    const { postId, post, imageUrl, platform } = req.body;

    if (!post) {
      return res.status(400).json({ error: 'post content is required' });
    }

    let doc;

    if (postId) {
      // Update the specific post (in case user edited it)
      doc = await Post.findByIdAndUpdate(
        postId,
        {
          post,
          imageUrl    : imageUrl || '',
          platform    : platform || 'linkedin',
          status      : 'published',
          publishedAt : new Date(),
        },
        { new: true }
      );

      if (!doc) {
        return res.status(404).json({ error: 'Post not found' });
      }
    } else {
      // Fall back: mark the most recent draft as published
      doc = await Post.findOneAndUpdate(
        { status: 'draft' },
        {
          post,
          imageUrl    : imageUrl || '',
          platform    : platform || 'linkedin',
          status      : 'published',
          publishedAt : new Date(),
        },
        { sort: { createdAt: -1 }, new: true }
      );

      if (!doc) {
        // No draft found — create a new published record
        doc = await Post.create({
          post,
          imageUrl    : imageUrl || '',
          platform    : platform || 'linkedin',
          status      : 'published',
          publishedAt : new Date(),
        });
      }
    }

    console.log(`🚀 Post published [${doc._id}] on ${doc.platform}`);

    // ── Optional: real LinkedIn / Twitter API calls go here ──
    // await postToLinkedIn(doc.post, doc.imageUrl);
    // await postToTwitter(doc.post);

    res.json({
      success    : true,
      message    : `Post published to ${doc.platform}`,
      _id        : doc._id,
      publishedAt: doc.publishedAt,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
