import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/site-url'

/**
 * Search engines and the AI tools that fetch pages to answer a question (and
 * cite them, with a link) are welcome. Crawlers that collect pages to train
 * models are not: Stephen's illustration and writing stay out of training
 * sets. The Studio and the API are never crawled.
 */
const PRIVATE = ['/studio', '/api/']

/** Fetch a page to answer or cite it, when someone asks. */
const ANSWER_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']

/** Collect pages to train models. */
const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'Bytespider']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: ANSWER_BOTS, allow: '/', disallow: PRIVATE },
      { userAgent: TRAINING_BOTS, disallow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
