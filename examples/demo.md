# Demo — using the example templates

This note shows how to *use* templates from another note. Put the two files in
`examples/HTML Templates/` into your vault's templates folder (default
`HTML Templates`), enable the plugin, then view this note in Reading view.

## person-card

```yamltemplate
template: person-card
name: Ada Lovelace
role: Mathematician
skills: [Analysis, Algorithms, Poetry]
```

## project-status — on track

```yamltemplate
template: project-status
name: Mobile App v2
owner: App Team
status: on-track
percent: 90
tags: [mobile, release]
tasks:
  - { title: Feature freeze, state: done }
  - { title: Beta testing, state: done }
  - { title: App store review, state: doing }
```

## project-status — blocked (minimal data)

```yamltemplate
template: project-status
name: Data Warehouse Cutover
status: blocked
percent: 25
tasks:
  - { title: Inventory sources, state: done }
  - { title: Schema mapping, state: doing }
  - { title: Cutover, state: blocked }
```
