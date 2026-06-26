# fix-flags-display — Design

## Changes in `lib/utils/flags.ts`

### Remove player entries (lines 84–101)

The `// Known golden boot candidates` block contains these entries that must be removed:

```ts
// REMOVE:
'Kylian Mbappé': '🇫🇷',
'Erling Haaland': '🇳🇴',
'Lionel Messi': '🇦🇷',
'Cristiano Ronaldo': '🇵🇹',
'Vinicius Jr.': '🇧🇷',
'Robert Lewandowski': '🇵🇱',
'Harry Kane': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
'Antoine Griezmann': '🇫🇷',
'Lautaro Martínez': '🇦🇷',
Morata: '🇪🇸',
'Alvaro Morata': '🇪🇸',
Pedri: '🇪🇸',
Gavi: '🇪🇸',
'Son Heung-min': '🇰🇷',
Richarlison: '🇧🇷',
'Darwin Núñez': '🇺🇾',
'Romelu Lukaku': '🇧🇪',
'Memphis Depay': '🇳🇱',
```

### Add/fix country entries

```ts
// CHANGE "Cape Verde" to:
'Cape Verde Islands': '🇨🇻',

// ADD:
Jordan: '🇯🇴',
'Congo DR': '🇨🇩',
```

## Impact on Components

`components/candidates.tsx` line 60: `const flag = getFlag(name)`. When `name` is
a player, `FLAGS` will no longer have that entry → `getFlag` returns `''` → the
`{flag && <span>...</span>}` block is not rendered. No changes to the component.

`app/groups/page.tsx`, `app/fixtures/page.tsx`, and `components/fixtures-today.tsx`
call `getFlag(team.name)`. Now Cape Verde Islands, Jordan, and Congo DR will return
their correct emoji.
