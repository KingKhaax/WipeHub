const crypto = require('crypto');
const { WCL, token, limited, send, cors } = require('./_lib');

// Caché de respuestas: la misma consulta (rankings, zonas, guilds, fichas…) hecha por varias personas se pide una sola vez a Warcraft Logs,
// así no se gasta la cuota de 3600 puntos por hora. Los informes (reportData) cambian en directo y nunca se guardan.
// Vive en la instancia (se pierde al reiniciarse) y tiene tope de tamaño; las consultas idénticas que llegan a la vez comparten una sola petición.
const CACHE = new Map(); // clave -> { at, status, body }
const INFLIGHT = new Map(); // clave -> promesa
const TTL = 10 * 60 * 1000;
const MAX_ENTRIES = 400, MAX_BYTES = 12 * 1024 * 1024;
let bytes = 0;
const cacheable = (query) => !/reportData/.test(query);
function remember(key, status, body) {
  if (status !== 200 || body.length > 1.5 * 1024 * 1024 || /"errors"\s*:/.test(body.slice(0, 400))) return;
  const old = CACHE.get(key);
  if (old) bytes -= old.body.length;
  CACHE.set(key, { at: Date.now(), status, body });
  bytes += body.length;
  while (CACHE.size > MAX_ENTRIES || bytes > MAX_BYTES) { // se tira lo más viejo
    const k = CACHE.keys().next().value;
    bytes -= CACHE.get(k).body.length;
    CACHE.delete(k);
  }
}

// POST /wcl  { query, variables, lang }  ->  API v2 de Warcraft Logs (solo consultas, nada de mutation)
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (limited(req)) return send(res, 429, { error: 'rate limit' });
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { query, variables, lang } = body;
    if (typeof query !== 'string' || query.length > 100000 || /\bmutation\b/i.test(query)) return send(res, 400, { error: 'bad query' });
    const host = ['es'].includes(lang) ? `https://${lang}.warcraftlogs.com` : WCL;
    const useCache = cacheable(query);
    const key = crypto.createHash('sha256').update(JSON.stringify([host, query, variables || null])).digest('hex');
    const hit = useCache && CACHE.get(key);
    if (hit && Date.now() - hit.at < TTL) {
      res.status(hit.status).setHeader('content-type', 'application/json');
      res.setHeader('x-wipehub-cache', 'hit');
      return res.send(hit.body);
    }
    let job = useCache && INFLIGHT.get(key);
    if (!job) {
      job = (async () => {
        const bearer = await token('wcl');
        const r = await fetch(`${host}/api/v2/client`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query, variables }),
        });
        const text = await r.text();
        if (useCache) remember(key, r.status, text);
        return { status: r.status, body: text };
      })();
      if (useCache) { INFLIGHT.set(key, job); job.finally(() => INFLIGHT.delete(key)).catch(() => {}); }
    }
    const out = await job;
    res.status(out.status).setHeader('content-type', 'application/json');
    res.setHeader('x-wipehub-cache', 'miss');
    res.send(out.body);
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
};
