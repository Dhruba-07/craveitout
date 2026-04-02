// Simple in-memory rate limiter (per serverless instance — best-effort)
// For multi-instance production use, replace with Upstash Redis or similar.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;          // requests per window per IP
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Patterns that suggest prompt-injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i, // "ignore previous instructions"
  /system\s*prompt/i,                                                  // "system prompt" references
  /<\/?s?ystem>/i,                                                     // XML-style system tags
  /you\s+are\s+now/i,                                                  // "you are now [different persona]"
];

function containsInjection(text) {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Guard: API key must be configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(503).json({ error: 'Service not configured' });
  }

  // Server-side rate limiting by IP
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { systemPrompt, userPrompt } = req.body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Missing systemPrompt or userPrompt' });
  }

  // Sanitize inputs — truncate and reject injection attempts
  const cleanSystem = String(systemPrompt).slice(0, 1000);
  const cleanUser   = String(userPrompt).slice(0, 2000);

  if (containsInjection(cleanSystem) || containsInjection(cleanUser)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: cleanSystem,
        messages: [{ role: 'user', content: cleanUser }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'Claude API error' });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
