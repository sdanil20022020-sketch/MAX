// Переходник Netlify: берёт старые api/index.js и api/mx.js (как на Vercel) и запускает их как функцию Netlify.
import idx from '../../api/index.js';
import mx from '../../api/mx.js';

export default async (request) => {
  const url = new URL(request.url);
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const t = await request.text();
    try { body = JSON.parse(t); } catch (e) { body = {}; }
  }
  const req = { url: url.pathname + url.search, method: request.method, headers, body };
  return new Promise((resolve, reject) => {
    const out = {};
    const res = {
      statusCode: 200,
      setHeader: (k, v) => { out[k] = v; },
      end: (chunk) => resolve(new Response(chunk == null || chunk === '' ? null : chunk, { status: res.statusCode, headers: out }))
    };
    const fn = url.pathname.replace(/\/+$/, '') === '/api/mx' ? mx : idx;
    Promise.resolve(fn(req, res)).catch(reject);
  });
};

export const config = { path: '/api/*' };
