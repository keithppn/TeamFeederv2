---
name: git-commit
description: Use while making code changes in a git repo to create small, logical commits with clear Conventional Commit messages after each completed unit of work.
---

# Git commit workflow

Commit as you work, not all at once at the end. Each commit should be one logical change that builds and passes tests.

## When to commit
- After each completed, working unit of work (a fixed bug, a new function plus its tests, a refactor step).
- Before starting a risky or unrelated change, so it can be reverted cleanly.
- Never commit code that is half-done or that breaks the build, unless the user asks for a WIP commit.

## Before committing
1. Run `git status` and `git diff` to review exactly what changed.
2. Run the project's tests, linter or build if they exist and are quick.
3. Stage only related files: use `git add <files>` or `git add -p`. Avoid `git add .` when unrelated changes are present.
4. Never commit secrets, `.env` files, credentials, large binaries or build output. If one is staged, unstage it and tell the user.

## Message format (Conventional Commits)

```
<type>(<optional scope>): <short summary>

<optional body: what changed and why, wrapped at 72 chars>

<optional footer: BREAKING CHANGE: ..., Closes #123>
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code change with no behavior change
- `perf`: performance improvement
- `test`: adding or fixing tests
- `docs`: documentation only
- `style`: formatting, no logic change
- `build` / `ci`: build system or CI config
- `chore`: maintenance (deps, tooling)

Rules for the summary line:
- Imperative mood: "add", "fix", "remove" (not "added" or "fixes").
- 50 characters or fewer when possible, never more than 72.
- Lowercase after the colon, no trailing period.
- Describe the change, not the activity ("fix null check in login handler", not "update file").

Write a body when the reason for the change isn't obvious from the summary. Explain *why*, not just *what*.

## Examples

```
feat(auth): add password reset via email
```

```
fix(api): handle empty response from payments service

The payments service returns 204 with no body when a customer has
no saved cards. We parsed it as JSON and crashed. Treat 204 as an
empty list.

Closes #482
```

```
refactor(cart): extract price calculation into helper
```

## Do not
- Do not push, force-push, rebase, amend pushed commits, or change branches unless the user asks.
- Do not use `--no-verify` to skip hooks; if a hook fails, fix the issue and commit again.
- Do not bundle unrelated changes into one commit.
- Do not write vague messages like "update", "fix stuff", "wip", or "changes".

## After committing
Show the user `git log --oneline -n <number of new commits>` so they can see what was committed.
