# CraveItOut 🍳

**AI-powered meal suggester** — tell it what's in your fridge and your mood, and get instant recipe ideas powered by Anthropic Claude.

## Features

- 🧊 **Fridge Tab** — input your ingredients and get AI-generated meal suggestions
- 🌡️ **Mood Tab** — browse recipes by mood (party, diet, sweet, sour, spicy)
- 🛒 **Splitter Tab** — split meal costs between people
- 👨‍🍳 **Cooking Mode** — step-by-step recipe with built-in timers
- 🛍️ **Grocery List** — auto-generated shopping list from any recipe
- 📊 **Nutrition Calculator** — estimated nutrition info per meal
- ❤️ **Favorites** — save meals you love (stored locally)
- 🌙 **Dark Mode**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Node.js serverless function (Vercel) |
| AI | [Anthropic Claude](https://www.anthropic.com/) (Haiku) |
| Storage | Browser `localStorage` |
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- An [Anthropic API key](https://console.anthropic.com/)

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Dhruba-07/craveitout.git
cd craveitout

# 2. Copy the environment template
cp .env.example .env.local

# 3. Fill in your API key in .env.local
#    ANTHROPIC_API_KEY=sk-ant-...

# 4. Start the local dev server (serves both frontend and API)
vercel dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `CLAUDE_MODEL` | No | Claude model ID (default: `claude-haiku-4-5-20251001`) |
| `ALLOWED_ORIGIN` | No | CORS origin restriction (default: `*`) — set to your Vercel URL in production |

See `.env.example` for a ready-to-copy template.

## Deployment

### Deploy to Vercel (recommended)

```bash
vercel deploy --prod
```

Then set your environment variables in the **Vercel Dashboard → Project → Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `ALLOWED_ORIGIN` | `https://your-app.vercel.app` |

Vercel auto-deploys on every push to `main`.

## API

### `POST /api/claude`

Generates a response from Claude.

**Request body:**
```json
{
  "systemPrompt": "You are a helpful chef...",
  "userPrompt": "I have eggs, cheese, and spinach. What can I make?"
}
```

**Response:**
```json
{
  "text": "..."
}
```

**Rate limiting:** 20 requests per IP per minute (server-side).

## Project Structure

```
craveitout/
├── api/
│   └── claude.js      # Serverless function — Claude API proxy
├── index.html         # Frontend SPA (all UI logic)
├── vercel.json        # Vercel routing + security headers
├── .env.example       # Environment variable template
└── package.json       # Minimal Node.js config (ESM)
```

## License

MIT
