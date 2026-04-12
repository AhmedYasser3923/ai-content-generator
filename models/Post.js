const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    idea: {
      type    : String,
      default : '(auto-generated)',
      trim    : true,
    },
    tone: {
      type : String,
      enum : ['professional', 'casual', 'bold'],
      default: 'professional',
    },
    platform: {
      type : String,
      enum : ['linkedin', 'twitter'],
      default: 'linkedin',
    },

    // Generated content
    research : { type: String, default: '' },
    post     : { type: String, default: '' },
    imageUrl : { type: String, default: '' },

    // Publish state
    status: {
      type    : String,
      enum    : ['draft', 'published'],
      default : 'draft',
    },
    publishedAt : { type: Date, default: null },

    // Optional: store the raw prompt sent to Claude
    promptUsed : { type: String, default: '' },
  },
  {
    timestamps: true,   // adds createdAt & updatedAt automatically
  }
);

// Index for fast history queries
PostSchema.index({ createdAt: -1 });
PostSchema.index({ status: 1 });

module.exports = mongoose.model('Post', PostSchema);
