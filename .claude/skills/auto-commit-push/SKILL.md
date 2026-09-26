---
name: auto-commit-push
description: Commit and push every change in the factory-dashboard repo to GitHub (Hamoudehh/factory-dashboard). Use after any change to the dashboard code, SPEC.md or README, and whenever the user says "commit", "push", "שמור לגיט", "תעלה לגיטהאב" or "commit and push". Also explains the automatic Stop hook and the watch mode that do this without being asked.
---

# Commit and push automatically

Every change in `factory-dashboard` ends up committed and pushed to `main` on GitHub. Three ways it happens:

| How | When it runs | Set up in |
|---|---|---|
| **Stop hook** (automatic) | After every Claude turn in this workspace | `.claude/settings.json` |
| **Watch mode** (automatic) | 15 seconds after you stop editing files yourself | `node tools/auto-commit.js --watch` |
| **This skill** (manual) | When asked, or when the hook is off | the steps below |

All three use the same script: `tools/auto-commit.js`.

## What the script does

1. `git status`. If nothing changed, it stops silently.
2. Runs the tests (`node --test`). **If a test fails, nothing is committed or pushed**, and a message says so.
3. `git add -A` and a commit named `Auto-commit: N files changed`, listing the files and ending with the Co-Authored-By line.
4. `git push`. If the push fails (no internet), the commit stays local and is pushed on the next run.
5. Prints one line: the commit hash and the files. The hook shows it in the chat.

`dist/` is not committed (it is in `.gitignore`), so `node tools/bundle.js` output never lands in git.

## Steps when running it by hand

```bash
node tools/auto-commit.js --dry-run   # show what would be committed
node tools/auto-commit.js             # test, commit, push
```

When Claude runs it: report the hash and the file list from the output. If the tests failed, run `node --test`, fix the failure, and run the script again. Do not commit around failing tests.

## Turning it on and off

- **Hook:** the `Stop` entry in `.claude/settings.json` (this repo) and in the parent workspace's `.claude/settings.json`. To pause it, open `/hooks` in a Claude terminal, or remove the entry.
- **Watch mode:** runs only while its terminal is open. Stop it with Ctrl+C.

## Rules

- Commit only in this repo. Never `--force`, never rewrite history.
- The commit message always ends with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- If a change is half-done and should not be pushed yet, say so, and pause the hook first.
