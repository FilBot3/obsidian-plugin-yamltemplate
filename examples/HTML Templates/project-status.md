# Project Status Card

A richer template: a project header with an owner and overall status badge, a
progress bar, a task list (each task with its own state), and an optional notes
section. Exercises `{{#each}}`, `{{#if}}`, `{{else}}`, `{{default}}`,
`{{upper}}`, `{{join}}`, and the `{{eq}}` comparison helper.

## Data

- `name` (string) — project name.
- `owner` (string, optional) — responsible person or team.
- `status` (string) — `on-track`, `at-risk`, or `blocked` (drives badge color).
- `percent` (number) — completion 0–100 for the progress bar.
- `tags` (list of strings, optional) — shown as a comma-joined line.
- `tasks` (list) — each `{ title, state }`; state is `done`, `doing`, or `blocked`.
- `notes` (string, optional) — free text; the notes block is hidden if omitted.

## Template source

```html
<div style="border:1px solid var(--background-modifier-border);border-radius:10px;padding:16px 18px;">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <h2 style="margin:0;">{{name}}</h2>
    <span style="padding:3px 12px;border-radius:999px;font-size:0.8em;color:#fff;background:{{#if (eq status "on-track")}}#2e7d32{{else}}{{#if (eq status "at-risk")}}#e0a800{{else}}#c62828{{/if}}{{/if}};">
      {{upper status}}
    </span>
  </div>

  <p style="color:var(--text-muted);margin:4px 0 12px;">
    Owner: {{default owner "Unassigned"}}
    {{#if tags}} · {{join tags ", "}}{{/if}}
  </p>

  <div style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;font-size:0.8em;color:var(--text-muted);">
      <span>Progress</span><span>{{default percent 0}}%</span>
    </div>
    <div style="background:var(--background-modifier-border);border-radius:6px;height:10px;overflow:hidden;">
      <div style="width:{{default percent 0}}%;height:100%;background:var(--interactive-accent);"></div>
    </div>
  </div>

  <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;">
    {{#each tasks}}
    <li style="display:flex;align-items:center;gap:8px;">
      <span style="width:16px;text-align:center;">
        {{#if (eq state "done")}}✅{{else}}{{#if (eq state "blocked")}}⛔{{else}}🔄{{/if}}{{/if}}
      </span>
      <span style="{{#if (eq state "done")}}text-decoration:line-through;color:var(--text-muted);{{/if}}">
        {{title}}
      </span>
    </li>
    {{/each}}
  </ul>

  {{#if notes}}
  <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--background-modifier-border);font-size:0.9em;color:var(--text-muted);">
    <strong>Notes:</strong> {{notes}}
  </div>
  {{/if}}
</div>
```

## Preview

```yamltemplate
template: project-status
name: Website Redesign
owner: Web Team
status: at-risk
percent: 60
tags: [frontend, q3]
tasks:
  - { title: Wireframes, state: done }
  - { title: Component library, state: done }
  - { title: Page templates, state: doing }
  - { title: Content migration, state: blocked }
notes: Content migration is waiting on the CMS export.
```
