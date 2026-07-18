# Roadmap

## Now

- Replace starter documentation with project-specific open-source docs.
- Keep the app local-first and deployable on Vercel.
- Improve the generated `SKILL.md` structure and validation feedback.
- Add import support for existing `SKILL.md` files.

## Next

- Export a zip containing one folder per skill.
- Add a skill template gallery.
- Add a markdown diff view between draft revisions.
- Add a shareable read-only preview for a skill.
- Add a CLI validator:

```bash
npx skillmaker validate ./my-skill/SKILL.md
```

## Later

- Optional AI provider integrations.
- GitHub Action for validating skill submissions in pull requests.
- Community skill gallery.
- Versioned skill packs.
- Browser extension or Codex integration for installing generated skills.

## Principles

- Local-first by default.
- No account required for the core workflow.
- Provider-agnostic AI assistance.
- Clear generated markdown over hidden magic.
- Friendly to first-time open-source contributors.
