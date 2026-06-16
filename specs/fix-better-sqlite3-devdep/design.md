# fix-better-sqlite3-devdep — Design

## Context

`better-sqlite3` es una dependencia nativa (requiere compilación con `node-gyp`) que solo
se usa en scripts locales (`scripts/*.ts`). Está en `dependencies`, lo que hace que Vercel
la instale y ejecute su postinstall, emitiendo un warning de deprecación de Node.js.

Según CLAUDE.md: "SQLite/better-sqlite3 queda para scripts locales e historia del proyecto;
no debe entrar al runtime de Vercel."

## Architecture

- **Config/Build**: cambio en `package.json` únicamente.
- Ninguna capa del harness (Skills, Models, Agents, UI) se toca.

## Cambio requerido

En `package.json`, mover de `dependencies` → `devDependencies`:

```json
"better-sqlite3": "^12.10.0",
"@types/better-sqlite3": "^7.6.13"
```

## Verificación pre-commit

```bash
grep -r "better-sqlite3" app/ components/ lib/agents/ lib/model/ lib/skills/ lib/data/
```

Debe retornar vacío. Si hay imports, resolverlos antes de mover.

## Alternativa si el warning persiste en Vercel

Agregar a `next.config.ts`:

```ts
serverExternalPackages: ['better-sqlite3']
```

Esto excluye el paquete del bundle aunque esté instalado.

## Testing Strategy

- `pnpm tsc --noEmit` — scripts locales siguen tipando correctamente
- `pnpm test` — tests no dependen de `better-sqlite3`
- `pnpm build` — build de Next.js pasa sin el paquete en `dependencies`
- Verificar en log de preview de Vercel que el warning desaparece
