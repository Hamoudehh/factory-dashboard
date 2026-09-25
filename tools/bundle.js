// Build single-file versions of the dashboard: node tools/bundle.js
//   dist/factory-dashboard.html  full page, all CSS and JS inlined (send to a phone, open offline-ish)
//   dist/artifact.html           same content without the html/head/body wrapper (for publishing as a claude.ai artifact)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');
// Function replacers so "$" in the sources is never treated as a pattern.
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) => `<style>\n${read(p)}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) => `<script>\n${read(p).replace(/<\/script/gi, '<\\/script')}\n</script>`);

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'factory-dashboard.html'), html);

const artifact = html
  .replace(/<!DOCTYPE html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/html>\s*/i, '')
  .replace(/<head>\s*/i, '')
  .replace(/<\/head>\s*/i, '')
  .replace(/<body>\s*/i, '')
  .replace(/<\/body>\s*/i, '')
  .replace(/<meta charset="UTF-8">\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
fs.writeFileSync(path.join(dist, 'artifact.html'), artifact);

const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
console.log(`dist/factory-dashboard.html ${kb(html)}`);
console.log(`dist/artifact.html ${kb(artifact)}`);
