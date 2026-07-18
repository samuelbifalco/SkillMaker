# Contributing

Thanks for helping improve SkillMaker.

## Ways To Contribute

- Improve the `SKILL.md` or `DESIGN.md` generation formats.
- Add skill or design templates for common workflows.
- Add validation rules and quality checks.
- Improve import/export flows.
- Improve accessibility, responsive layout, and keyboard support.
- Write documentation, examples, and screenshots.

## Local Setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm test
```

## Pull Request Guidelines

- Keep changes focused and explain the user-facing behavior.
- Include tests for parser, generator, or validation changes.
- Avoid adding server-side secrets or required hosted services.
- Keep SkillMaker useful without an account.
- Update `README.md` or `ROADMAP.md` when behavior or scope changes.

## Code Style

- Prefer simple React state and small helpers.
- Keep local-first behavior explicit.
- Use accessible labels for controls.
- Do not add generated cache, build, or log files.

## Good First Issues

Good starter contributions include:

- Add another built-in skill or design template.
- Add a markdown import parser improvement.
- Add a validation rule with a clear message.
- Improve empty states.
- Add screenshots to the README.
