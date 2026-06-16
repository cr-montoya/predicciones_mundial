# fix-flags-display — Design

## Cambios en `lib/utils/flags.ts`

### Eliminar entradas de jugadores (líneas 84–101)

El bloque `// Known golden boot candidates` contiene estas entradas que deben
eliminarse:

```ts
// ELIMINAR:
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

### Agregar/corregir entradas de países

```ts
// CAMBIAR "Cape Verde" por:
'Cape Verde Islands': '🇨🇻',

// AGREGAR:
Jordan: '🇯🇴',
'Congo DR': '🇨🇩',
```

## Impacto en componentes

`components/candidates.tsx` line 60: `const flag = getFlag(name)`. Cuando `name` es
un jugador, `FLAGS` ya no tendrá esa entrada → `getFlag` devuelve `''` → el bloque
`{flag && <span>...</span>}` no se renderiza. Sin cambios en el componente.

`app/groups/page.tsx` y `app/fixtures/page.tsx` y `components/fixtures-today.tsx`
llaman `getFlag(team.name)`. Ahora Cape Verde Islands, Jordan y Congo DR devolverán
su emoji correcto.
