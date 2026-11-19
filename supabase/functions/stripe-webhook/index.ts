// Quarter Alley: receives Stripe's payment events and adds the tokens to the buyer's wallet.
// Point a Stripe webhook at this function's URL for: checkout.session.completed,
// checkout.session.async_payment_succeeded. Deployed with JWT checks off: Stripe signs
// each request instead, and this function rejects anything without a valid signature.

const PACKS: Record<string, number> = { pocket: 60, roll: 200, bucket: 500 }; // keep in step with the shop function

const env = (k: string) => Deno.env.get(k) || '';
const enc = new TextEncoder();

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}
function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function verify(raw: string, header: string, secret: string) {
  const parts = header.split(',').map((p) => p.split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // replay guard: 5 minutes
  const want = await hmacHex(secret, `${t}.${raw}`);
  return sigs.some((s) => sameText(s, want));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const secret = env('STRIPE_WEBHOOK_SECRET');
  if (!secret) return new Response('shop not set up', { status: 503 });

  const raw = await req.text();
  if (!(await verify(raw, req.headers.get('Stripe-Signature') || '', secret))) {
    return new Response('bad signature', { status: 400 });
  }

  const event = JSON.parse(raw);
  const type = event.type;
  if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
    return new Response('ignored', { status: 200 });
  }
  const s = event.data.object;
  if (s.payment_status !== 'paid') return new Response('not paid yet', { status: 200 }); // async methods finish later

  const user = s.client_reference_id || (s.metadata && s.metadata.user_id);
  const pack = s.metadata && s.metadata.pack;
  const tokens = PACKS[pack];
  if (!user || !tokens) {
    console.error('webhook: missing user or unknown pack', s.id, pack);
    return new Response('missing data', { status: 200 }); // don't make Stripe retry forever
  }

  const r = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/credit_purchase`, {
    method: 'POST',
    headers: {
      apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user: user, p_session: s.id, p_pack: pack, p_tokens: tokens,
      p_amount: s.amount_total ?? 0, p_currency: s.currency || 'usd',
    }),
  });
  if (!r.ok) {
    console.error('webhook: credit failed', r.status, await r.text());
    return new Response('credit failed', { status: 500 }); // Stripe retries; the ledger stops double credits
  }
  return new Response('ok', { status: 200 });
});
