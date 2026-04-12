const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Build a platform-aware system prompt
 */
function buildSystemPrompt(platform, tone) {
  const platformRules = {
    linkedin: `You are an expert LinkedIn content strategist. 
Posts should be 150-300 words, use line breaks for readability, 
include 3-5 relevant hashtags at the end, and have a strong opening hook.
Writing style: thought-leadership, value-driven, professional storytelling.`,

    twitter: `You are an expert Twitter/X content strategist.
Posts must be under 280 characters. Be punchy, direct, and high-impact.
Use 1-2 hashtags max. No fluff — every word must earn its place.`,
  };

  const toneMap = {
    professional: 'Use a confident, authoritative, and polished tone.',
    casual      : 'Use a friendly, conversational, and relatable tone.',
    bold        : 'Use a provocative, attention-grabbing, and opinionated tone.',
  };

  return `${platformRules[platform] || platformRules.linkedin}
${toneMap[tone] || toneMap.professional}
Always respond with valid JSON only — no markdown fences, no extra text.`;
}

/**
 * Generate research summary for a given idea
 */
async function generateResearch(idea) {
  const message = await client.messages.create({
    model      : 'claude-sonnet-4-20250514',
    max_tokens : 800,
    messages   : [
      {
        role   : 'user',
        content: `Research this topic and write a concise, factual summary (100-150 words) 
with 3-4 key insights, recent trends, and relevant data points.
Topic: "${idea}"

Respond with JSON only:
{
  "research": "your research summary here"
}`,
      },
    ],
  });

  const text = message.content.find(b => b.type === 'text')?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return parsed.research || 'No research available.';
}

/**
 * Generate the social media post
 */
async function generatePost(idea, tone, platform, research) {
  const systemPrompt = buildSystemPrompt(platform, tone);

  const message = await client.messages.create({
    model      : 'claude-sonnet-4-20250514',
    max_tokens : 600,
    system     : systemPrompt,
    messages   : [
      {
        role   : 'user',
        content: `Write a ${platform} post about: "${idea}"

Context from research:
${research}

Respond with JSON only:
{
  "post": "your ${platform} post here"
}`,
      },
    ],
  });

  const text = message.content.find(b => b.type === 'text')?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return parsed.post || 'Could not generate post.';
}

/**
 * Generate an image prompt based on the post content
 */
async function generateImagePrompt(idea, post) {
  const message = await client.messages.create({
    model      : 'claude-sonnet-4-20250514',
    max_tokens : 200,
    messages   : [
      {
        role   : 'user',
        content: `Create a concise DALL-E image generation prompt (max 60 words) 
for a professional social media post about: "${idea}".
Style: clean, modern, business-appropriate, high quality.
No text in the image. No people's faces.
Post context: ${post?.substring(0, 100)}

Respond with JSON only:
{
  "imagePrompt": "your image prompt here"
}`,
      },
    ],
  });

  const text = message.content.find(b => b.type === 'text')?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return parsed.imagePrompt || `Professional illustration about ${idea}, clean modern style, no text`;
}

/**
 * Auto-pick an idea if user didn't provide one
 */
async function generateIdea() {
  const message = await client.messages.create({
    model      : 'claude-sonnet-4-20250514',
    max_tokens : 150,
    messages   : [
      {
        role   : 'user',
        content: `Suggest one trending, high-engagement business/tech post idea 
for social media in 2026. Make it specific and timely.
Respond with JSON only:
{
  "idea": "your post idea here"
}`,
      },
    ],
  });

  const text = message.content.find(b => b.type === 'text')?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return parsed.idea || 'How AI is reshaping business operations in 2026';
}

module.exports = { generateResearch, generatePost, generateImagePrompt, generateIdea };
