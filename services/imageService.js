const axios = require('axios');

const PROVIDER = (process.env.IMAGE_PROVIDER || 'dalle').toLowerCase();

/**
 * Generate an image using DALL-E 3 (OpenAI)
 */
async function generateWithDalle(prompt) {
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model  : 'dall-e-3',
      prompt : prompt,
      n      : 1,
      size   : '1024x1024',
      quality: 'standard',
    },
    {
      headers: {
        Authorization : `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data?.data?.[0]?.url || null;
}

/**
 * Generate an image using Stability AI
 */
async function generateWithStability(prompt) {
  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale   : 7,
      height      : 1024,
      width       : 1024,
      steps       : 30,
      samples     : 1,
    },
    {
      headers: {
        Accept        : 'application/json',
        Authorization : `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    }
  );

  // Stability returns base64; we return a data URL
  const b64 = response.data?.artifacts?.[0]?.base64;
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

/**
 * Main export — picks provider from .env
 */
async function generateImage(prompt) {
  if (!prompt) throw new Error('Image prompt is required');

  try {
    if (PROVIDER === 'stability') {
      return await generateWithStability(prompt);
    }
    return await generateWithDalle(prompt);
  } catch (err) {
    // Surface the provider error clearly
    const detail = err.response?.data?.error?.message
      || err.response?.data?.message
      || err.message;
    throw new Error(`Image generation failed (${PROVIDER}): ${detail}`);
  }
}

module.exports = { generateImage };
