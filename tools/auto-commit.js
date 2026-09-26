// Commit and push every change in this repo.
//
//   node tools/auto-commit.js            one pass: test, commit, push (used by the Claude Stop hook)
//   node tools/auto-commit.js --dry-run  show what would be committed, change nothing
//   node tools/auto-commit.js --watch    keep running; commit 15 seconds after you stop editing
//
// Tests (node --test) must pass before anything is committed.
// Output for the hook is one JSON line: {"systemMessage": "..."}.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const WATCH = args.includes('--watch');
const QUIET_MS = 15000;
const TRAILER = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';

function git(...a) {
  return execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function changedFiles() {
  // No trim here: each porcelain line starts with a two-letter status that may begin with a space.
  const out = execFileSync('git', ['-c', 'core.quotePath=false', 'status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' });
  return out.split('\n').filter((l) => l.trim()).map((l) => l.slice(3).replace(/^"|"$/g, ''));
}

function testsPass() {
  try {
    execFileSync(process.execPath, ['--test'], { cwd: root, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function report(message) {
  if (WATCH) console.log(`[${new Date().toLocaleTimeString('he-IL')}] ${message}`);
  else process.stdout.write(JSON.stringify({ systemMessage: message }) + '\n');
}

function commitAndPush() {
  let files;
  try {
    files = changedFiles();
  } catch (e) {
    return report(`auto-commit: git לא זמין בתיקייה ${root}`);
  }
  if (!files.length) return; // nothing to do, stay silent

  const list = files.slice(0, 5).join(', ') + (files.length > 5 ? ` ועוד ${files.length - 5}` : '');
  if (DRY) return report(`auto-commit (ניסיון): היו נשמרים ${files.length} קבצים: ${list}`);

  if (!testsPass()) {
    return report(`auto-commit: הבדיקות נכשלו, לא נשמר ולא נדחף. ${files.length} קבצים ממתינים. הרץ node --test כדי לראות מה נשבר.`);
  }

  const subject = `Auto-commit: ${files.length} file${files.length > 1 ? 's' : ''} changed`;
  const body = files.map((f) => `- ${f}`).join('\n');
  try {
    git('add', '-A');
    git('commit', '-q', '-m', `${subject}\n\n${body}\n\n${TRAILER}`);
  } catch (e) {
    return report(`auto-commit: ה-commit נכשל: ${String(e.stderr || e.message).split('\n')[0]}`);
  }
  const hash = git('rev-parse', '--short', 'HEAD');
  try {
    git('push', '-q');
    report(`נשמר ונדחף ל-GitHub: ${hash} (${files.length} קבצים: ${list})`);
  } catch (e) {
    report(`נשמר מקומית (${hash}) אבל ה-push נכשל: ${String(e.stderr || e.message).split('\n')[0]}. ינסה שוב בשינוי הבא.`);
  }
}

// Retry pushing commits that stayed local after an earlier failure.
function pushPending() {
  try {
    const ahead = git('rev-list', '--count', '@{u}..HEAD');
    if (Number(ahead) > 0 && !DRY) git('push', '-q');
  } catch (e) { /* no upstream or offline: next run tries again */ }
}

if (WATCH) {
  const ignored = (f) => !f || /(^|[\\/])(\.git|dist|node_modules)([\\/]|$)/.test(f);
  let timer = null;
  console.log(`auto-commit פעיל על ${root}. שינוי נשמר ונדחף ${QUIET_MS / 1000} שניות אחרי העריכה האחרונה. Ctrl+C לעצירה.`);
  fs.watch(root, { recursive: true }, (_event, file) => {
    if (ignored(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => { commitAndPush(); pushPending(); }, QUIET_MS);
  });
} else {
  commitAndPush();
  pushPending();
}
