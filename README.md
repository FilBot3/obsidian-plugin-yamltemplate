# YAML Template

An [Obsidian](https://obsidian.md) plugin that renders a fenced `yamltemplate`
code block by applying its YAML data to a [Handlebars](https://handlebarsjs.com)
HTML template resolved from a configurable templates folder.

Write structured data in a note; get rendered HTML in Reading view.

## Example

In any note:

````markdown
```yamltemplate
template: person-card
name: Jane Doe
role: Staff Engineer
skills: [Rust, TypeScript, Obsidian]
```
````

In Reading view this renders the `person-card` template, populated with the
YAML data, instead of showing the raw code block.

## How it works

1. The block's YAML is parsed. The `template:` key selects a template; every
   other top-level key becomes template **data**.
2. The template name is resolved to a file in your templates folder
   (default: `HTML Templates`).
3. The template is compiled with Handlebars and applied to the data.
4. The resulting HTML is sanitized (by default) and injected in place of the
   code block.

Handlebars compiles without `eval`, so the plugin also works on Obsidian mobile.

## Templates

A template is referenced by name (e.g. `template: person-card`) and resolved,
in order, to one of:

1. `HTML Templates/person-card.md`
2. `HTML Templates/person-card.html.md`
3. `HTML Templates/person-card.html`

For the `.md` variants, the plugin extracts the **first fenced `html` (or
`handlebars`/`hbs`) code block** as the template body. This is the recommended
style: the raw HTML stays as browsable, syntax-highlighted source in your vault
and is **not** rendered as live HTML while you edit the template. If a `.md`
file has no such fenced block, its whole body (minus frontmatter) is used. A
plain `.html` file is used as-is.

### Writing a template

Create `HTML Templates/person-card.md`:

````markdown
# Person Card

Renders a person's name, role, and skills.

## Data
- `name` (string)
- `role` (string)
- `skills` (list of strings)

```html
<div class="person-card">
  <h2>{{name}}</h2>
  <p class="role">{{role}}</p>
  <ul>
    {{#each skills}}
      <li>{{this}}</li>
    {{/each}}
  </ul>
</div>
```
````

The top of the file is human-readable documentation. The `html` block is the
template itself. To preview the template inside the template file, add a
`yamltemplate` block with sample data right below it — the `html` block stays as
code, and the `yamltemplate` block renders live.

## Data syntax

- The `template:` key names the template. If omitted, the plugin uses the
  **Default template** setting (if any).
- All other top-level keys are passed to the template as data:

  ````markdown
  ```yamltemplate
  template: person-card
  name: Jane Doe
  role: Staff Engineer
  skills: [Rust, TypeScript]
  ```
  ````

- Alternatively, nest data under a `data:` key. Nested `data:` values override
  sibling top-level keys:

  ````markdown
  ```yamltemplate
  template: person-card
  data:
    name: Jane Doe
    role: Staff Engineer
    skills: [Rust, TypeScript]
  ```
  ````

## Custom helpers

Handlebars is deliberately "logic-less" — its core has **no** comparison,
boolean, math, or string-transform helpers, so out of the box you can't even
write `{{#if (eq status "done")}}`. To make templates practical, this plugin
registers its own set of custom helpers on top of the standard Handlebars
block helpers.

### Value formatting

| Helper       | Usage                          | Result                                          |
| ------------ | ------------------------------ | ----------------------------------------------- |
| `join`       | `{{join skills ", "}}`         | Joins an array with a separator (default `, `). |
| `upper`      | `{{upper name}}`               | Upper-cases a value.                            |
| `lower`      | `{{lower name}}`               | Lower-cases a value.                            |
| `capitalize` | `{{capitalize name}}`          | Upper-cases the first character.                |
| `json`       | `{{json this}}`                | Pretty-prints a value as JSON.                  |
| `default`    | `{{default role "Unknown"}}`   | Falls back when the value is empty.             |
| `length`     | `{{length skills}}`            | Length of an array or string (else `0`).        |

### Comparison (use inside `{{#if}}`)

| Helper | Usage                       | Result                                     |
| ------ | --------------------------- | ------------------------------------------ |
| `eq`   | `{{#if (eq a b)}}`          | Loose equality (`200` matches `"200"`).    |
| `ne`   | `{{#if (ne a b)}}`          | Loose inequality.                          |
| `gt`   | `{{#if (gt a b)}}`          | Numeric greater-than.                      |
| `lt`   | `{{#if (lt a b)}}`          | Numeric less-than.                         |
| `gte`  | `{{#if (gte a b)}}`         | Numeric greater-than-or-equal.             |
| `lte`  | `{{#if (lte a b)}}`         | Numeric less-than-or-equal.                |

### Boolean

| Helper | Usage                       | Result                                          |
| ------ | --------------------------- | ----------------------------------------------- |
| `and`  | `{{#if (and a b)}}`         | True when both values are truthy.               |
| `or`   | `{{#if (or a b)}}`          | True when either value is truthy.               |
| `not`  | `{{#if (not a)}}`           | Negates a value (empty arrays count as falsy).  |

### Math

| Helper     | Usage                  | Result                          |
| ---------- | ---------------------- | ------------------------------- |
| `add`      | `{{add a b}}`          | Numeric addition.               |
| `subtract` | `{{subtract a b}}`     | Numeric subtraction.            |
| `multiply` | `{{multiply a b}}`     | Numeric multiplication.         |
| `divide`   | `{{divide a b}}`       | Numeric division.               |
| `mod`      | `{{mod a b}}`          | Remainder (e.g. for striping).  |
| `range`    | `{{#each (range 1 5)}}`| Inclusive array of integers.    |

Standard Handlebars block helpers (`{{#each}}`, `{{#if}}`, `{{#unless}}`, `{{#with}}`)
are also available. Helpers can be nested as subexpressions, e.g.
`{{#if (and (gt hp 0) (eq (mod @index 2) 0))}}`.

## Live refresh

When you edit, rename, or delete a template file, any open notes with blocks
that depend on it re-render automatically. Changing a plugin setting also
re-renders all currently visible blocks.

## Settings

- **Templates folder** — where template files are resolved from (default
  `HTML Templates`).
- **Default template** — used when a block omits `template:`. Blank by default.
- **Sanitize rendered HTML** — strips `<script>`, other dangerous tags, inline
  event handlers, and `javascript:` URIs before injecting output. On by default;
  disable only if you fully trust every template.

## Development

```bash
npm install     # install dependencies
npm run dev     # build CSS + bundle in watch mode
npm run build   # build CSS, type-check, and produce a production main.js
npm test        # run unit tests
npm run check   # one command: build CSS, verify scoping, type-check, test
```

`npm run check` is the full local gate and mirrors what CI runs.

### Styling (W3.CSS)

Templates can use [W3.CSS](https://www.w3schools.com/w3css/) utility classes
(colors, cards, tables, layout columns, badges, spacing, borders, etc.). A
**subset** of W3.CSS v5.01 is bundled and **scoped** so it only applies inside
the plugin's rendered blocks — it cannot alter the rest of the Obsidian UI.

`styles.css` is a **generated** artifact. Do not edit it by hand. It is built
from two sources by `scripts/build-css.mjs`:

- `src/styles.base.css` — the plugin's own hand-written rules.
- `vendor/w3.css` — pristine W3.CSS v5.01.

The build step keeps only an allowlist of W3.CSS class families, drops
app-chrome/fixed-position components (modals, sidebars, overlays) and all bare
element selectors (`html`, `body`, `h1`–`h6`, the embedded normalize reset),
then prefixes every remaining selector with `.yamltemplate-rendered`. To change
what ships, edit `src/styles.base.css` or the allowlist/denylist in the build
script and regenerate:

```bash
npm run css:build   # regenerate styles.css
npm run css:verify  # assert scoping/reduction invariants
```

`css:verify` fails the build if any unscoped/bare or denied selector ever leaks
into `styles.css`, so scoping cannot silently regress. Because typography base
rules are dropped, text inside a rendered block inherits your Obsidian theme's
fonts rather than W3.CSS's defaults. Note that fixed-position W3.CSS components
are intentionally excluded — even when scoped, `position: fixed` would visually
escape the block.

## Manual installation

Copy `main.js`, `manifest.json`, and `styles.css` into
`<vault>/.obsidian/plugins/yamltemplate/`, then enable the plugin in
Settings → Community plugins.

## License

MIT
