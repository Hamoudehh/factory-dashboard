// Cloudflare Worker: lets the public dashboard (GitHub Pages) read and write Airtable
// without the Airtable token ever reaching the browser. Setup: worker/README.md.
//
// Settings → Variables and Secrets in Cloudflare:
//   AIRTABLE_TOKEN      (Secret)  Airtable personal access token, this base only, data.records:read + write
//   DASHBOARD_PASSWORD  (Secret)  the password people type once in the dashboard
//   ALLOWED_ORIGIN      (Text)    https://hamoudehh.github.io   (several: comma separated)
//
// The password is the real lock. The origin check only stops other websites from using the Worker
// from a visitor's browser.
const BASE_ID = 'appa0VSn54qgGlUkF';
const WRITABLE = new Set([
  'tbloLMxVGxiga2Na2', // machines
  'tblmlNfsHT9hHziI6', // products
  'tblPwjjPlnvXAVxaj', // workers
  'tblzU7fKHuvpMdeRl', // items
  'tbl68KtijRuaMwHy9', // productionLogs
  'tblpzJ8W6AUqnSUcy', // attendance
  'tblvBn164sbepEiTs', // stockMoves
  'tbloqzWgTgW0wnDF9', // settings
]);
const READ_ONLY = new Set(['tbl63fKbxF1KPHRD0']); // suppliers: edited in Airtable only

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });
}

// Compares SHA-256 digests byte by byte, so the time taken does not reveal how much of the password matched.
async function samePassword(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map((s) => crypto.subtle.digest('SHA-256', enc.encode(String(s)))));
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const allowed = String(env.ALLOWED_ORIGIN || 'https://hamoudehh.github.io').split(',').map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Dashboard-Key',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!allowed.includes(origin)) return json({ error: 'origin' }, 403, cors);
    if (!env.AIRTABLE_TOKEN || !env.DASHBOARD_PASSWORD) return json({ error: 'not_configured' }, 500, cors);
    if (!(await samePassword(request.headers.get('X-Dashboard-Key') || '', env.DASHBOARD_PASSWORD))) {
      return json({ error: 'bad_key' }, 401, cors);
    }

    const url = new URL(request.url);
    const m = url.pathname.match(/^\/v0\/(app[A-Za-z0-9]{14})\/(tbl[A-Za-z0-9]{14})$/);
    const table = m && m[1] === BASE_ID ? m[2] : null;
    const method = request.method;
    const permitted = table && ((method === 'GET' && (WRITABLE.has(table) || READ_ONLY.has(table)))
      || ((method === 'PATCH' || method === 'DELETE') && WRITABLE.has(table)));
    if (!permitted) return json({ error: 'not_allowed' }, 404, cors);

    const upstream = await fetch(`https://api.airtable.com${url.pathname}${url.search}`, {
      method,
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: method === 'PATCH' ? await request.text() : undefined,
    });
    return new Response(await upstream.text(), { status: upstream.status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
  },
};
