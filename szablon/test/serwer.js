// Podstawiony serwer w stylu ntfy.sh — tylko do testów szablonu na localhost.
// POST /temat  → zapis wiadomości;  GET /temat/sse?since=all → strumień;  GET /temat/json?poll=1&since=all → lista
// POST /__odmowa/1 włącza odpowiedź 429 na każdy POST z wiadomością, /__odmowa/0 ją wyłącza.
// POST /__odmowa_sse/1 włącza odpowiedź 429 na otwarcie strumienia (jak przy przekroczonym limicie), /__odmowa_sse/0 ją wyłącza.
const http = require('http');
const tematy = {};
let odmowa = false, odmowaSse = false;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const u = new URL(req.url, 'http://x');
  const cz = u.pathname.split('/').filter(Boolean);
  if (req.method === 'POST' && cz[0] === '__odmowa') { odmowa = cz[1] === '1'; res.end('ok'); return; }
  if (req.method === 'POST' && cz[0] === '__odmowa_sse') { odmowaSse = cz[1] === '1'; res.end('ok'); return; }
  if (!cz.length) { res.statusCode = 404; res.end(); return; }
  const t = tematy[cz[0]] || (tematy[cz[0]] = { msgs: [], subs: new Set() });
  if (req.method === 'POST' && cz.length === 1) {
    if (odmowa) { res.statusCode = 429; res.end('{"code":42901,"http":429,"error":"limit reached"}'); return; }
    let b = '';
    req.on('data', d => { b += d; });
    req.on('end', () => {
      const m = { id: Math.random().toString(36).slice(2, 14), time: Math.floor(Date.now() / 1000), event: 'message', topic: cz[0], message: b };
      t.msgs.push(m);
      t.subs.forEach(s => s.write('data: ' + JSON.stringify(m) + '\n\n'));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(m));
    });
    return;
  }
  if (req.method === 'GET' && cz[1] === 'sse') {
    if (odmowaSse) { res.statusCode = 429; res.setHeader('Content-Type', 'application/json'); res.end('{"code":42909,"http":429,"error":"limit reached"}'); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
    res.write('event: open\ndata: ' + JSON.stringify({ id: 'open', time: 0, event: 'open', topic: cz[0] }) + '\n\n');
    if (u.searchParams.get('since') === 'all') t.msgs.forEach(m => res.write('data: ' + JSON.stringify(m) + '\n\n'));
    t.subs.add(res);
    req.on('close', () => t.subs.delete(res));
    return;
  }
  if (req.method === 'GET' && cz[1] === 'json') {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.end(t.msgs.map(m => JSON.stringify(m)).join('\n') + '\n');
    return;
  }
  res.statusCode = 404; res.end();
}).listen(Number(process.argv[2] || 8799), '127.0.0.1');
