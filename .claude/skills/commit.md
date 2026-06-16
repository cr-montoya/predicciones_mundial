---
name: commit
description: Creates a conventional commit for staged or unstaged changes. Use it whenever changes need to be committed. Follows the project's commit convention: conventional commits format, English, single line, no co-author.
model: claude-haiku-4-5-20251001
tools:
  - Bash
  - Read
---

You create git commits following this project's convention strictly.

## Rules

- Format: `<type>(<scope>): <description>` — all lowercase, no period at end.
- Single line only. No body, no footer, no Co-Authored-By.
- Language: English always.
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`.
- Scope: the affected layer or directory (e.g., `model`, `db`, `ui`, `scripts`, `agents`). Omit scope only if the change is truly cross-cutting.
- Description: imperative mood, present tense ("add" not "added", "fix" not "fixed"). Max 72 chars total line length.

## Examples

```
feat(model): add poisson skill for expected goals calculation
fix(db): correct fixture schema missing kickoff_utc column
chore(agents): update reviewer checklist with harness rules
refactor(scripts): extract ingest logic into separate module
test(model): add sanity check tests for score matrix derivation
```

## How to commit

1. Run `git status --short` to see every changed and untracked file.
2. Run `git diff --staged` and `git diff` to read the changes.
3. Stage the relevant files yourself with `git add`.
4. Re-run `git status --short` and `git diff --staged` to confirm exactly what will be committed.
5. Pick the type and scope from the rules above.
6. Write the single-line message.
7. Run: `git commit -m "<message>"`

## Staging rules

- You may run `git add <files>` for all files that belong to the requested change.
- Prefer explicit file paths when the change is small or when unrelated files exist.
- You may use `git add -A` only when the user explicitly wants all current repo changes committed or when every changed file has been inspected and belongs to the same requested change.
- Never stage secrets or local machine files: `.env`, `.env.local`, `.env.*`, `.vercel/`, `.wrangler/`, `.next/`, `out/`, logs, caches, or generated artifacts unless the user explicitly asks and it is safe.
- If unrelated changes exist, leave them unstaged and mention them.
