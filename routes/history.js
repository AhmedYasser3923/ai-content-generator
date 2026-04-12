const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');

/**
 * GET /api/history?limit=20&page=1&status=all
 * Returns paginated list of posts from DB
 */
router.get('/', async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
    const page   = Math.max(parseInt(req.query.page)   || 1, 1);
    const status = req.query.status;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const [posts, total] = await Promise.all([
      Post.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select('idea tone platform status createdAt publishedAt'),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/history/:id
 * Returns a single post with all fields
 */
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/history/:id
 * Deletes a single post
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/history
 * Clears all posts (use with caution)
 */
router.delete('/', async (req, res, next) => {
  try {
    const result = await Post.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
