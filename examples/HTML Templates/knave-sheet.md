# Knave 2e Character Sheet

An HTML template modeled on the Knave 2e character sheet: a title bar with the
character name, six ability scores (STR/DEX/CON/INT/WIS/CHA), careers and
description, level / HP / armor / XP, and 20 item slots.

## Data

- `name` (string) — character name.
- `abilities` (map) — `str`, `dex`, `con`, `int`, `wis`, `cha` (numbers).
- `careers` (string) — the character's careers.
- `description` (string) — physical/roleplay description.
- `level` (number), `xp` (number).
- `hp` (map) — `max`, `current`.
- `armor` (map) — `points`, `ac`.
- `maxItemSlots` (number).
- `items` (list of strings) — item names; rendered into the 20 numbered slots,
  with checked boxes for filled slots.

## Template source

```html
<div style="border:2px solid #111;border-radius:10px;padding:14px;max-width:720px;background:#fff;color:#111;font-family:Georgia,'Times New Roman',serif;">

  <!-- Title bar -->
  <div style="display:flex;align-items:stretch;gap:12px;margin-bottom:12px;">
    <div style="background:#111;color:#fff;border-radius:8px;padding:10px 22px;font-size:2em;font-weight:bold;letter-spacing:1px;font-variant:small-caps;">Knave</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-variant:small-caps;font-weight:bold;letter-spacing:2px;color:#111;">Name</div>
      <div style="border-bottom:2px dotted #111;font-size:1.3em;padding:2px 4px;">{{name}}</div>
    </div>
  </div>

  <!-- Ability scores -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;">
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.str}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">STR</div></div>
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.dex}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">DEX</div></div>
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.con}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">CON</div></div>
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.int}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">INT</div></div>
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.wis}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">WIS</div></div>
    <div style="text-align:center;"><div style="border:2px solid #111;border-radius:8px;height:52px;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">{{abilities.cha}}</div><div style="background:#111;color:#fff;border-radius:6px;margin-top:4px;padding:2px 0;font-variant:small-caps;font-weight:bold;letter-spacing:1px;">CHA</div></div>
  </div>

  <!-- Careers / description + level / hp / armor / xp -->
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px;">
    <div>
      <div style="font-variant:small-caps;font-weight:bold;letter-spacing:1px;">Careers</div>
      <div style="border-bottom:2px dotted #111;min-height:1.4em;padding:2px 4px;margin-bottom:10px;">{{careers}}</div>
      <div style="font-variant:small-caps;font-weight:bold;letter-spacing:1px;">Description</div>
      <div style="border-bottom:2px dotted #111;min-height:1.4em;padding:2px 4px;">{{description}}</div>
    </div>

    <div style="display:flex;gap:10px;align-items:flex-start;">
      <!-- Level + XP stacked -->
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
        <div style="border:3px solid #111;border-radius:50%;width:70px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-size:1.6em;font-weight:bold;line-height:1;">{{level}}</div>
          <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;">Level</div>
        </div>
        <div style="border:2px solid #111;border-radius:8px;width:70px;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-size:1.2em;font-weight:bold;line-height:1;">{{xp}}</div>
          <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;">XP</div>
        </div>
      </div>

      <!-- HP + Armor -->
      <div style="flex:1;">
        <div style="border:2px solid #111;border-radius:8px;padding:6px 8px;">
          <div style="font-weight:bold;font-size:1.2em;font-variant:small-caps;">HP</div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;text-align:center;">
              <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;">Max</div>
              <div style="font-size:1.3em;font-weight:bold;">{{hp.max}}</div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;">Current</div>
              <div style="font-size:1.3em;font-weight:bold;">{{hp.current}}</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <div style="flex:1;border:2px solid #111;border-radius:8px;text-align:center;padding:4px;">
            <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;line-height:1.1;">Armor Points</div>
            <div style="font-size:1.3em;font-weight:bold;">{{armor.points}}</div>
          </div>
          <div style="flex:1;border:2px solid #111;border-radius:8px;text-align:center;padding:4px;">
            <div style="font-size:0.6em;font-variant:small-caps;font-weight:bold;">AC</div>
            <div style="font-size:1.3em;font-weight:bold;">{{armor.ac}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Item slots -->
  <div style="border:2px solid #111;border-radius:8px;overflow:hidden;">
    <div style="background:#111;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:6px 12px;">
      <span style="font-size:1.2em;font-weight:bold;font-variant:small-caps;letter-spacing:1px;">Item Slots</span>
      <span style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:0.7em;font-variant:small-caps;font-weight:bold;text-align:right;line-height:1.1;">Max<br>Item Slots</span>
        <span style="background:#fff;color:#111;border-radius:6px;min-width:34px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;">{{maxItemSlots}}</span>
      </span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(10,1fr);">
      {{#each (range 1 20)}}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #111;{{#if (gt this 10)}}border-left:1px solid #111;{{/if}}padding:5px 12px;">
        <span><strong>{{this}}</strong> {{lookup ../items (subtract this 1)}}</span>
        <span style="border:2px solid #111;border-radius:4px;width:15px;height:15px;display:inline-block;background:{{#if (lookup ../items (subtract this 1))}}#111{{else}}transparent{{/if}};"></span>
      </div>
      {{/each}}
    </div>
  </div>
</div>
```

## Preview

```yamltemplate
template: knave-sheet
name: Grimble Ashfoot
abilities: { str: 2, dex: 4, con: 1, int: 3, wis: 0, cha: 5 }
careers: Beggar, Cutpurse
description: Wiry and quick, a scar across one brow, dressed in patched leathers.
level: 3
xp: 7
hp: { max: 9, current: 5 }
armor: { points: 3, ac: 13 }
maxItemSlots: 12
items:
  - Dagger
  - Torch (x3)
  - Rope, 50ft
  - Rations (x2)
  - Lockpicks
  - Waterskin
  - Grappling hook
  - Silver coins (24)
```
