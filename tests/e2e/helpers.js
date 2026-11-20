// Keeps tests offline and deterministic: no live accounts, CDN libraries served from node_modules.
const path = require('node:path');
const fs = require('node:fs');

const THREE = require.resolve('three/build/three.min.js');
const GAMES = fs.readdirSync(path.join(__dirname, '..', '..', 'games')).filter((d) =>
  fs.statSync(path.join(__dirname, '..', '..', 'games', d)).isDirectory()).sort();

async function prepare(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/supabase\.co|cdn\.jsdelivr\.net/, (r) => r.abort());            // play as a guest
  await page.route(/cdnjs\.cloudflare\.com\/.*three(\.min)?\.js/, (r) => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
  return errors;
}
module.exports = { GAMES, prepare };
