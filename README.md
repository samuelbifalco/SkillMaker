# SkillMaker

SkillMaker is an open-source workspace for designing, validating, and exporting reusable AI skills as `SKILL.md` files.

It helps people turn rough instructions, examples, reference notes, and workflow rules into a clean skill document that an AI coding agent can follow.

## Why It Exists

Good agent skills are more than prompts. They need clear trigger conditions, required inputs, ordered workflow steps, reference material, expected outputs, and guardrails. SkillMaker gives those pieces a focused authoring surface instead of asking people to start from a blank markdown file.

## Features

- Create and manage multiple skill drafts.
- Convert a plain-language idea into a structured draft.
- Capture purpose, audience, triggers, inputs, workflow, reference material, output, and guardrails.
- Preview the generated `SKILL.md` in real time.
- Score draft readiness with practical quality checks.
- Copy or download a single skill.
- Export all skills into one markdown bundle.
- Store drafts locally in the browser.
- Deploy as a standard Next.js app on Vercel.

## Demo

Add your deployed Vercel URL here:

```text
https://your-skillmaker-site.vercel.app
```

## Screenshots

Add screenshots to `public/` or a `docs/` folder and link them here.

## Getting Started

### Prerequisites

- Node.js `>=22.13.0`
- npm

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

The local app runs at the URL printed by the dev server.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Deploy

SkillMaker includes `vercel.json` so Vercel uses the expected build settings.

```bash
vercel --prod
```

Important Vercel settings:

- Framework preset: `Next.js`
- Build command: `next build --webpack`
- Install command: `npm ci --ignore-scripts`
- Output directory: `.next`
- Deployment protection: `None` for a public share link

## Project Structure

```text
app/
  page.tsx        SkillMaker workspace
  globals.css    Product styling
  layout.tsx     Metadata and root layout
public/
  og.png         Social preview image
tests/
  rendered-html.test.mjs
vercel.json      Vercel deployment settings
```

Some Cloudflare Sites starter files remain for compatibility with the original generated workspace. The Vercel build scopes TypeScript to the app surface.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md), then look for issues labeled `good first issue` or `help wanted`.

## Security

SkillMaker is currently local-first. Drafts are stored in browser local storage unless a user copies, downloads, or exports them. Please report security issues through [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
