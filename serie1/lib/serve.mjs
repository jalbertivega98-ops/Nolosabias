// Sirve ~/work desde disco dentro de Playwright (sin servidor HTTP aparte)
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.css': 'text/css', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
export async function serve(p) {
  await p.route('http://localhost:8778/**', async r => {
    const u = new URL(r.request().url()); let f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT)) return r.fulfill({ status: 403 });
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); const body = fs.readFileSync(f);
      return r.fulfill({ status: 200, body, headers: { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' } });
    } catch { return r.fulfill({ status: 404, body: 'nf' }); }
  });
}
