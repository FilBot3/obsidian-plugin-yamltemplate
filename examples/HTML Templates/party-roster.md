# Party Roster

Demonstrates multi-level nesting: a list of party members, where each member is
an object with a nested `abilities` map and a nested `inventory` list of item
objects. Exercises nested `{{#each}}`, deep property access (`abilities.str`),
parent-scope access (`../name`), and `@root` for shared data.

## Data

- `party` (string) — the party/campaign name (top-level, shared).
- `members` (list) — each member is an object:
  - `name` (string)
  - `role` (string)
  - `abilities` (map) — `str`, `dex`, `con`, `int`, `wis`, `cha`
  - `hp` (map) — `max`, `current`
  - `inventory` (list) — each `{ name, qty }`

## Template source

```html
<div style="border:2px solid #111;border-radius:10px;padding:14px 16px;max-width:720px;font-family:Georgia,serif;color:#111;background:#fff;">
  <h2 style="margin:0 0 10px;font-variant:small-caps;letter-spacing:1px;">{{party}}</h2>

  <div style="display:flex;flex-direction:column;gap:12px;">
    {{#each members}}
    <div style="border:1px solid var(--background-modifier-border,#ccc);border-radius:8px;padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
        <strong style="font-size:1.15em;">{{name}}</strong>
        <span style="color:#666;">{{default role "Adventurer"}}</span>
      </div>

      <div style="font-size:0.9em;color:#333;margin:4px 0 8px;">
        HP {{hp.current}}/{{hp.max}}
        &nbsp;·&nbsp;
        STR {{abilities.str}} · DEX {{abilities.dex}} · CON {{abilities.con}} ·
        INT {{abilities.int}} · WIS {{abilities.wis}} · CHA {{abilities.cha}}
      </div>

      <details>
        <summary style="cursor:pointer;font-variant:small-caps;font-weight:bold;">
          Inventory ({{inventory.length}})
        </summary>
        <ul style="margin:6px 0 0;padding-left:20px;">
          {{#each inventory}}
          <li>{{this.name}}{{#if (gt this.qty 1)}} ×{{this.qty}}{{/if}} <span style="color:#999;font-size:0.85em;">— carried by {{../name}} ({{@root.party}})</span></li>
          {{else}}
          <li style="color:#999;">Empty-handed.</li>
          {{/each}}
        </ul>
      </details>
    </div>
    {{/each}}
  </div>
</div>
```

## Preview

```yamltemplate
template: party-roster
party: The Ashfoot Company
members:
  - name: Grimble Ashfoot
    role: Cutpurse
    abilities: { str: 2, dex: 4, con: 1, int: 3, wis: 0, cha: 5 }
    hp: { max: 9, current: 5 }
    inventory:
      - { name: Dagger, qty: 1 }
      - { name: Torch, qty: 3 }
      - { name: Silver coin, qty: 24 }
  - name: Mirabel Thornwick
    role: Hedge Witch
    abilities: { str: 1, dex: 3, con: 2, int: 5, wis: 4, cha: 2 }
    hp: { max: 11, current: 8 }
    inventory:
      - { name: Sickle, qty: 1 }
      - { name: Candle, qty: 5 }
      - { name: Spellbook, qty: 1 }
  - name: Brother Cassian
    role: Acolyte
    abilities: { str: 3, dex: 1, con: 3, int: 2, wis: 5, cha: 2 }
    hp: { max: 10, current: 10 }
    inventory: []
```
