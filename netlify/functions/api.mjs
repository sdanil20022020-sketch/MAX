// Запускает сервер из src/worker.js как функцию Netlify (без библиотеки pg).
import worker from '../../src/worker.js';

export default async (request) => {
  return worker.fetch(request, {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_KEY: process.env.ADMIN_KEY,
    ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) }
  });
};

export const config = { path: '/api/*' };
