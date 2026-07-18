# Roadmap

## Now

- Replace starter documentation with project-specific open-source docs.
- Keep the app local-first and deployable on Vercel.
- Improve the generated `SKILL.md` and `DESIGN.md` structures and validation feedback.
- Improve import support for existing `SKILL.md` and `DESIGN.md` files.

## Next

- Export a zip containing one folder per generated document.
- Add a skill and design template gallery.
- Add a markdown diff view between draft revisions.
- Add a shareable read-only preview for a generated document.
- Add a CLI validator:

```bash
npx skillmaker validate ./my-skill/SKILL.md ./my-design/DESIGN.md
```

## Later

- Optional AI provider integrations.
- GitHub Action for validating generated documents in pull requests.
- Community skill and design gallery.
- Versioned document packs.
- Browser extension or Codex integration for installing generated files.

## Principles

- Local-first by default.
- No account required for the core workflow.
- Provider-agnostic AI assistance.
- Clear generated markdown over hidden magic.
- Friendly to first-time open-source contributors.
