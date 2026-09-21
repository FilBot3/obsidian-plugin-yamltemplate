# Person Card

Renders a person's name, role, and list of skills as a styled card.

Reference this template from any note with:

````markdown
```yamltemplate
template: person-card
name: Jane Doe
role: Staff Engineer
skills: [Rust, TypeScript]
```
````

## Data

- `name` (string) — the person's display name.
- `role` (string) — their title or role.
- `skills` (list of strings) — rendered as a bulleted list.

## Template source

This `html` block is the template body. It is shown as code here (not rendered),
and it is what the plugin extracts when another note uses `template: person-card`.

```html
<div class="person-card">
  <h2>{{name}}</h2>
  <p class="role">{{default role "—"}}</p>
  <ul>
    {{#each skills}}
      <li>{{this}}</li>
    {{/each}}
  </ul>
</div>
```

## Live preview

The block below renders the template above using sample data, so you can preview
the template while editing this file. (The `html` block stays as source; this
`yamltemplate` block renders live.)

```yamltemplate
template: person-card
name: Jane Doe
role: Staff Engineer
skills: [Rust, TypeScript, Obsidian]
```
