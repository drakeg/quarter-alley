// Quarter Alley token shop.
//   GET  → { ready, packs }  (ready is false until the Stripe secrets are set)
//   POST { pack, return_url } with the player's sign-in token → { url } of a Stripe Checkout page
// Secrets (Supabase → Edge Functions → Secrets): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// Optional: ALLOWED_ORIGINS, a comma-separated list of sites allowed as return_url.

// Prices live here, on the server, so a player can't change what they pay. Keep in step with stripe-webhook.
const PACKS = [
  { id: 'pocket', name: 'Pocketful of Tokens', tokens: 60, cents: 199 },
  { id: 'roll', name: 'Roll of Tokens', tokens: 200, cents: 499, tag: 'Most popular' },
  { id: 'bucket', name: 'Bucket of Tokens', tokens: 500, cents: 999, tag: 'Best value' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const env = (k: string) => Deno.env.get(k) || '';
const ready = () => !!(env('STRIPE_SECRET_KEY') && env('STRIPE_WEBHOOK_SECRET'));
const allowed = () =>
  (env('ALLOWED_ORIGINS') || 'https://drakeg.github.io,http://localhost:8000,http://localhost:8766')
    .split(',').map((s) => s.trim()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method === 'GET') {
    return json({ ready: ready(), packs: PACKS.map(({ id, name, tokens, cents, tag }) => ({ id, name, tokens, cents, tag: tag || null })) });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!ready()) return json({ error: 'shop_closed' }, 503);

  // Who is buying? Check the player's sign-in token with Supabase Auth.
  const auth = req.headers.get('Authorization') || '';
  const who = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { Authorization: auth, apikey: env('SUPABASE_ANON_KEY') } });
  if (!who.ok) return json({ error: 'not_signed_in' }, 401);
  const user = await who.json();
  if (!user || !user.id) return json({ error: 'not_signed_in' }, 401);

  let body: { pack?: string; return_url?: string } = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const pack = PACKS.find((p) => p.id === body.pack);
  if (!pack) return json({ error: 'no_such_pack' }, 400);

  let back: URL;
  try { back = new URL(String(body.return_url || '')); } catch { return json({ error: 'bad_return_url' }, 400); }
  if (!allowed().includes(back.origin)) return json({ error: 'bad_return_url' }, 400);
  back.hash = '';
  back.searchParams.delete('shop');
  const withShop = (v: string) => { const u = new URL(back); u.searchParams.set('shop', v); return u.toString(); };

  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('line_items[0][quantity]', '1');
  f.set('line_items[0][price_data][currency]', 'usd');
  f.set('line_items[0][price_data][unit_amount]', String(pack.cents));
  f.set('line_items[0][price_data][product_data][name]', `${pack.name} (${pack.tokens} tokens)`);
  f.set('line_items[0][price_data][product_data][description]', 'Tokens for the Quarter Alley arcade. 1 token = 1 game.');
  f.set('client_reference_id', user.id);
  f.set('metadata[user_id]', user.id);
  f.set('metadata[pack]', pack.id);
  f.set('metadata[tokens]', String(pack.tokens));
  f.set('payment_intent_data[metadata][user_id]', user.id);
  f.set('payment_intent_data[metadata][pack]', pack.id);
  if (user.email) f.set('customer_email', user.email);
  f.set('success_url', withShop('success'));
  f.set('cancel_url', withShop('cancel'));

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: f,
  });
  const s = await r.json();
  if (!r.ok || !s.url) {
    console.error('stripe checkout error', r.status, s && s.error && s.error.message);
    return json({ error: 'checkout_failed' }, 502);
  }
  return json({ url: s.url });
});
