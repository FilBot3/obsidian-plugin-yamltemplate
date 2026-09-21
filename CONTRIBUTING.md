# Contributing to YAML Template

Thanks for your interest in improving the plugin. This document covers the
development setup, the quality gate, and conventions.

## Prerequisites

- Node.js 18 or newer (`node --version`)
- npm

## Setup

```bash
git clone <repo-url>
cd obsidian-yamltemplate
npm install
```

## Development workflow

```bash
npm run dev        # esbuild in watch mode -> rebuilds main.js on change
npm run build      # type-check + production bundle (main.js)
npm run lint       # ESLint over src/ and tests/
npm test           # run the unit test suite (vitest)
npm run test:watch # vitest in watch mode
```

To try changes in a real vault, symlink or copy `main.js`, `manifest.json`, and
`styles.css` into `<vault>/.obsidian/plugins/yamltemplate/`, then reload
Obsidian (or toggle the plugin off/on).

## Project layout

```
src/
  main.ts               Plugin entry: registers the yamltemplate code-block
                        processor and wires live refresh on template edits.
  renderer.ts           Pure logic: parseBlock (YAML), renderTemplate
                        (Handlebars), sanitizeHtml. No Obsidian imports.
  template-resolver.ts  Resolves a template name to a vault file and extracts
                        the template body (first html/handlebars fenced block).
  settings.ts           Settings model and settings tab.
tests/
  *.test.ts             Vitest unit tests.
  mocks/obsidian.ts     Test double for the Obsidian API surface used in tests.
examples/               Example template note(s).
```

## Testing

Obsidian plugins are awkward to test end-to-end because the `obsidian` runtime
is only provided by the app. Our strategy:

- **Keep logic pure and Obsidian-free where possible.** `renderer.ts` imports
  only `handlebars` and `js-yaml`, so it is unit-tested directly.
- **Mock the thin Obsidian surface.** Modules that import from `obsidian`
  (e.g. `template-resolver.ts`) are tested with `tests/mocks/obsidian.ts`, which
  Vitest aliases in via `vitest.config.ts`. Add to that mock only the API a test
  actually needs.
- **Cover behavior, not implementation.** Prefer asserting on inputs/outputs of
  `parseBlock`, `renderTemplate`, `sanitizeHtml`, and `extractTemplateSource`.

When adding a feature or fixing a bug, add or update a test. New pure functions
should be exported so they can be unit-tested.

## Code style

- **TypeScript**, strict mode. `npm run build` must pass with no errors.
- **ESLint** must pass with no errors (`npm run lint`). Fix issues rather than
  disabling rules; if a disable is truly necessary, scope it narrowly and
  explain why in the comment.
- **JSDoc on everything.** All functions, methods, classes, and interfaces —
  including private helpers — use JSDoc block comments (`/** ... */`) with
  `@param`, `@returns`, and `@throws` where applicable.
- Use tabs for indentation (matching the existing files).

## Before opening a pull request

Run the full local gate and make sure it is green:

```bash
npm run lint && npm run build && npm test
```

Then describe what changed and why, and note anything you could not verify.

## Commit messages

Use clear, imperative subject lines (e.g. `Add join helper for arrays`). Keep
the subject under ~72 characters and explain the *what* and *why* in the body
when the change is non-trivial.
