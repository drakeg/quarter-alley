/* Quarter Alley shared arcade layer
 * - Token wallet: in the browser for guests, on the server for signed-in players
 * - Insert-token coin slot overlay: Arcade.insertCoin(callback)
 * - Accounts (Supabase): sign in with an email link, Google or GitHub
 * - Scores: Arcade.submitScore(score) at game over; leaderboards page reads them
 * - "Report a bug" form that opens a prefilled GitHub issue
 * Include before a game's own script:  <script src="../../assets/arcade.js"></script>
 */
(() => {
  'use strict';
  const CONFIG = {
    startTokens: 10,      // tokens for a brand-new player
    dailyTokens: 10,      // balance is topped up to this once per day
    freePlay: false,      // true = no tokens needed anywhere (also: add ?freeplay to a URL)
    repo: 'drakeg/quarter-alley',
    // Accounts: paste your Supabase project URL and anon (public) key to switch sign-in on.
    // See docs/LOGIN.md. Leave empty and everyone plays as a guest.
    supabaseUrl: '',
    supabaseAnonKey: ''
  };
  const GAMES = ['Arcade home page', 'Stack Shack', 'Prairie Schooner', 'Ashfall', 'Glitch Grid', 'Sunset Circuit', 'Spore Storm', 'Rascal Road', 'Iron Treads', 'Starfall', 'Ridgeline', 'Driftrock', 'Lifeline', 'Accounts / sign-in', 'Leaderboards'];
  const KEY = 'qa-wallet';
  const freePlay = CONFIG.freePlay || /[?&]freeplay\b/.test(location.search);
  const listeners = [];
  const emit = () => listeners.forEach(f => { try { f(tokens()); } catch (e) {} });

  /* ---------- local (guest) wallet ---------- */
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  let mem = null;
  function read() {
    let w = null;
    try { w = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!w && mem) w = mem;
    if (!w || typeof w.tokens !== 'number') w = { tokens: CONFIG.startTokens, day: today(), played: 0 };
    if (w.day !== today()) { w.day = today(); if (w.tokens < CONFIG.dailyTokens) w.tokens = CONFIG.dailyTokens; }
    return w;
  }
  function write(w) { mem = w; try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {} emit(); }
  write(read());

  /* ---------- accounts (Supabase) ---------- */
  const acct = { configured: !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey), client: null, user: null, profile: null, wallet: null, ready: null, error: '' };
  const signedIn = () => !!(acct.client && acct.user);
  function tokens() { return signedIn() && acct.wallet ? acct.wallet.tokens : read().tokens; }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); }); }
  async function refreshAccount() {
    if (!acct.client || !acct.user) { acct.profile = null; acct.wallet = null; emit(); return; }
    try {
      const [w, p] = await Promise.all([acct.client.rpc('get_wallet'), acct.client.from('profiles').select('display_name').eq('id', acct.user.id).maybeSingle()]);
      if (w.error) throw w.error;
      acct.wallet = Array.isArray(w.data) ? w.data[0] : w.data;
      acct.profile = p.data || { display_name: null };
      acct.error = '';
    } catch (e) { acct.error = 'Could not reach the arcade server.'; }
    emit();
  }
  if (acct.configured) {
    acct.ready = (async () => {
      try {
        if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js');
        acct.client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });
        const { data } = await acct.client.auth.getSession();
        acct.user = data && data.session ? data.session.user : null;
        await refreshAccount();
        acct.client.auth.onAuthStateChange((_ev, session) => { const was = acct.user && acct.user.id; acct.user = session ? session.user : null; if ((acct.user && acct.user.id) !== was) refreshAccount(); });
      } catch (e) { acct.error = 'Sign-in is unavailable right now.'; acct.client = null; }
      emit();
    })();
  }
  const displayName = () => (acct.profile && acct.profile.display_name) || (acct.user && acct.user.email ? acct.user.email.split('@')[0] : 'Player');
  const gameSlug = () => { const m = location.pathname.match(/\/games\/([^/]+)/); return m ? m[1] : null; };

  /* ---------- sound ---------- */
  let AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function ping(f, t, d, v, type = 'sine') { const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), s = a.currentTime + t; o.type = type; o.frequency.setValueAtTime(f, s); g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.001, s + d); o.connect(g).connect(a.destination); o.start(s); o.stop(s + d + .02); }
  function coinSound() { ping(2400, 0, .12, .12); ping(3100, .03, .1, .08); ping(1900, .28, .08, .07); ping(2600, .36, .06, .05); ping(90, .55, .25, .35, 'triangle'); ping(140, .56, .12, .2, 'square'); }
  function creditSound() { ping(660, 0, .08, .08, 'square'); ping(880, .08, .08, .08, 'square'); ping(1320, .16, .14, .08, 'square'); }

  /* ---------- graphics ---------- */
  let uid = 0;
  function coinSVG(size) {
    const id = 'qac' + (uid++);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <defs><radialGradient id="${id}a" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#e8b34a"/><stop offset="1" stop-color="#8a5a12"/></radialGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8821f"/><stop offset="1" stop-color="#f6d27a"/></linearGradient></defs>
      <circle cx="32" cy="32" r="31" fill="#6e440c"/>
      <circle cx="32" cy="32" r="29" fill="url(#${id}a)" stroke="#7a4d10" stroke-width="2" stroke-dasharray="2 2.2"/>
      <circle cx="32" cy="32" r="21" fill="url(#${id}b)" stroke="#a87320" stroke-width="1.5"/>
      <text x="32" y="38.5" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="17" font-weight="900" fill="#7a4d10">QA</text>
      <path d="M14 22 A20 20 0 0 1 30 12" stroke="#fff8dc" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>
    </svg>`;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- styles ---------- */
  const css = `
  .qa-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .qa-chips{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .qa-chip{display:inline-flex;align-items:center;gap:6px;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#f4ead2;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:4px 10px 4px 4px;font-variant-numeric:tabular-nums;white-space:nowrap}
  button.qa-chip{cursor:pointer;padding:6px 11px}
  button.qa-chip:hover,button.qa-chip:focus-visible{border-color:#f2b632;outline:none}
  .qa-av{width:18px;height:18px;border-radius:50%;display:inline-grid;place-items:center;font:800 10px/1 system-ui,sans-serif;color:#1b1408;background:#f2b632}
  .qa-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(5,6,10,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#f4ead2;overscroll-behavior:contain}
  .qa-door{position:relative;width:min(100%,400px);max-height:100%;overflow:auto;border-radius:14px;padding:22px 22px 18px;background:
     radial-gradient(circle at 14px 14px,#6b7078 0 3px,#24272c 3.5px 5px,transparent 5.5px),radial-gradient(circle at calc(100% - 14px) 14px,#6b7078 0 3px,#24272c 3.5px 5px,transparent 5.5px),
     radial-gradient(circle at 14px calc(100% - 14px),#6b7078 0 3px,#24272c 3.5px 5px,transparent 5.5px),radial-gradient(circle at calc(100% - 14px) calc(100% - 14px),#6b7078 0 3px,#24272c 3.5px 5px,transparent 5.5px),
     repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),linear-gradient(180deg,#3a3e45,#1c1e22);
     box-shadow:0 0 0 2px #0c0d0f,inset 0 1px 0 rgba(255,255,255,.15),0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center}
  .qa-marq{font:900 26px/1 "Arial Black",Impact,sans-serif;letter-spacing:.08em;color:#ffe9d0;text-shadow:0 0 6px #ff3b2e,0 0 18px #ff3b2e,0 0 36px #c2120a;margin:4px 0 0}
  .qa-ready .qa-marq{animation:qa-flick 2.4s infinite}
  @keyframes qa-flick{0%,92%,100%{opacity:1}93%{opacity:.35}95%{opacity:1}96%{opacity:.5}}
  .qa-sub{margin:0;font-size:13px;color:#b9b2a2}
  .qa-slots{display:flex;gap:18px;justify-content:center}
  .qa-slot{position:relative;width:110px;height:150px;border:0;padding:0;border-radius:10px;cursor:pointer;background:linear-gradient(180deg,#eef1f4,#9aa1aa 45%,#d6dade 55%,#7d848d);box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),0 3px 0 #0c0d0f,0 6px 14px rgba(0,0,0,.5)}
  .qa-slot:focus-visible{outline:3px solid #f2b632;outline-offset:3px}
  .qa-slot .qa-slit{position:absolute;left:50%;top:16px;width:8px;height:44px;margin-left:-4px;border-radius:4px;background:#050506;box-shadow:inset 0 2px 3px #000,0 0 0 3px #5a6068,0 0 0 4px #c9ced4}
  .qa-slot .qa-lamp{position:absolute;left:12px;right:12px;bottom:14px;height:62px;border-radius:6px;background:radial-gradient(ellipse at 50% 40%,#ff6a55,#c4130c 55%,#5a0604);box-shadow:inset 0 0 0 2px #3a0402,inset 0 4px 10px rgba(255,220,200,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:900 15px/1.05 "Arial Black",Impact,sans-serif;letter-spacing:.04em;text-shadow:0 1px 0 #6a0703}
  .qa-slot .qa-lamp small{font:700 9px/1.2 system-ui,sans-serif;letter-spacing:.14em;opacity:.85}
  .qa-ready .qa-slot .qa-lamp{animation:qa-glow 1.2s ease-in-out infinite alternate}
  .qa-slot.qa-off .qa-lamp{background:radial-gradient(ellipse at 50% 40%,#6a4a48,#3a1c1a 60%,#1a0a09);animation:none;color:#bba}
  .qa-slot.qa-hot .qa-lamp{background:radial-gradient(ellipse at 50% 40%,#fff1c0,#ffb02e 55%,#a35a00);animation:none}
  @keyframes qa-glow{from{box-shadow:inset 0 0 0 2px #3a0402,inset 0 4px 10px rgba(255,220,200,.45),0 0 6px rgba(255,60,40,.3)}to{box-shadow:inset 0 0 0 2px #3a0402,inset 0 4px 10px rgba(255,220,200,.6),0 0 22px rgba(255,60,40,.85)}}
  .qa-tray{display:flex;align-items:center;gap:14px;background:linear-gradient(180deg,#0d0e10,#22252a);border-radius:10px;padding:10px 16px;box-shadow:inset 0 3px 8px #000}
  .qa-coin{border:0;background:none;padding:0;cursor:grab;touch-action:none;border-radius:50%;line-height:0;filter:drop-shadow(0 4px 4px rgba(0,0,0,.6));transition:transform .15s}
  .qa-coin:hover{transform:translateY(-3px) rotate(-8deg)}
  .qa-coin:focus-visible{outline:3px solid #f2b632;outline-offset:3px}
  .qa-coin:active{cursor:grabbing}
  .qa-count{font:900 28px/1 "Arial Black",Impact,sans-serif;font-variant-numeric:tabular-nums;color:#f6d27a;text-align:left}
  .qa-count small{display:block;font:600 11px/1.3 system-ui,sans-serif;color:#b9b2a2;letter-spacing:.06em;text-transform:uppercase}
  .qa-credit{font:900 18px/1 "Courier New",monospace;letter-spacing:.2em;color:#7dff8a;text-shadow:0 0 8px #2bd147;min-height:18px}
  .qa-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .qa-btn{font:600 14px/1 system-ui,sans-serif;color:#f4ead2;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:9px 14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}
  .qa-btn:hover,.qa-btn:focus-visible{border-color:#f2b632;outline:none}
  .qa-btn.qa-pri{background:#f2b632;border-color:#f2b632;color:#1b1408}
  .qa-btn[disabled]{opacity:.5;cursor:default}
  .qa-fly{position:fixed;z-index:2147483001;pointer-events:none;line-height:0}
  .qa-form{width:min(100%,480px);background:#1b1d22;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:12px;text-align:left;max-height:100%;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.6)}
  .qa-form h2{margin:0;font:800 22px/1.1 system-ui,sans-serif}
  .qa-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;color:#cfc6b4}
  .qa-form textarea,.qa-form select,.qa-form input{font:14px/1.4 system-ui,sans-serif;color:#f4ead2;background:#0f1013;border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:8px}
  .qa-form textarea{min-height:84px;resize:vertical}
  .qa-form textarea:focus-visible,.qa-form select:focus-visible,.qa-form input:focus-visible{outline:2px solid #f2b632;outline-offset:1px}
  .qa-form p{margin:0;font-size:12.5px;color:#9a9284;line-height:1.45}
  .qa-or{display:flex;align-items:center;gap:10px;font-size:12px;color:#7d776c}
  .qa-or::before,.qa-or::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.12)}
  .qa-stack{display:flex;flex-direction:column;gap:8px}
  .qa-msg{color:#7dff8a!important;min-height:1.2em}
  .qa-err{color:#ff8a6a!important}
  .qa-toast{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482999;background:#1b1d22;color:#f4ead2;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:9px 16px;font:600 13px/1.2 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:calc(100% - 32px);text-align:center}
  .qa-toast a,.qa-toast button{color:#f2b632;background:none;border:0;font:inherit;cursor:pointer;text-decoration:underline;padding:0}
  @media (prefers-reduced-motion:reduce){.qa-ready .qa-marq,.qa-ready .qa-slot .qa-lamp{animation:none}.qa-coin{transition:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- modals ---------- */
  let open = null;
  function trap(e) {
    if (!open) return;
    e.stopImmediatePropagation();
    if (e.type !== 'keydown') return;
    if (e.key === 'Escape') { e.preventDefault(); open.close(); }
    else if (e.key === 'Tab') {
      const f = [...open.el.querySelectorAll('button,a,textarea,select,input')].filter(x => !x.disabled && x.offsetParent);
      if (!f.length) return; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    } else if (open.onKey) open.onKey(e);
  }
  ['keydown', 'keyup', 'keypress'].forEach(t => window.addEventListener(t, trap, true));
  function modal(html) {
    const prevFocus = document.activeElement;
    const el = document.createElement('div'); el.className = 'qa-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = html; (document.fullscreenElement || document.body).appendChild(el);
    const m = { el, close() { el.remove(); open = null; try { prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); } catch (e) {} m.onClose && m.onClose(); } };
    el.addEventListener('pointerdown', e => { if (e.target === el) m.close(); });
    open = m; return m;
  }
  let toastEl = null, toastT = 0;
  function toast(html, ms = 4200) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement('div'); toastEl.className = 'qa-toast'; toastEl.setAttribute('role', 'status'); toastEl.innerHTML = html;
    (document.fullscreenElement || document.body).appendChild(toastEl);
    clearTimeout(toastT); const el = toastEl; toastT = setTimeout(() => { el.remove(); if (toastEl === el) toastEl = null; }, ms);
    return toastEl;
  }

  /* ---------- insert coin ---------- */
  async function spendServer() {
    const r = await acct.client.rpc('spend_token');
    if (r.error) { const out = /out_of_tokens/.test(r.error.message || ''); throw new Error(out ? 'out' : 'net'); }
    const left = Array.isArray(r.data) ? r.data[0] : r.data;
    if (acct.wallet) { acct.wallet.tokens = typeof left === 'number' ? left : Math.max(0, acct.wallet.tokens - 1); acct.wallet.games_played = (acct.wallet.games_played || 0) + 1; }
    emit();
  }
  async function insertCoin(onCredit, opts = {}) {
    ac();
    if (freePlay) { onCredit(); return; }
    if (open) return;
    if (acct.ready) { await Promise.race([acct.ready, new Promise(r => setTimeout(r, 2500))]); }
    const server = signedIn() && !!acct.wallet;
    const n = tokens();
    const outOf = n <= 0;
    const who = server ? `Signed in as ${esc(displayName())}` : (acct.configured && acct.client ? 'Playing as a guest' : '');
    const m = modal(`<div class="qa-door ${outOf ? '' : 'qa-ready'}" aria-labelledby="qa-t">
        <p class="qa-marq" id="qa-t">${outOf ? 'OUT OF TOKENS' : 'INSERT TOKEN'}</p>
        <p class="qa-sub">${outOf ? `Your free tokens refill to ${CONFIG.dailyTokens} tomorrow.` : esc(opts.label || '1 token = 1 game')}</p>
        <div class="qa-slots">
          <button type="button" class="qa-slot ${outOf ? 'qa-off' : ''}" data-slot aria-label="Coin slot: insert a token"><span class="qa-slit"></span><span class="qa-lamp">1 TOKEN<small>PUSH</small></span></button>
          <button type="button" class="qa-slot qa-off" tabindex="-1" aria-hidden="true" disabled><span class="qa-slit"></span><span class="qa-lamp">1 TOKEN<small>PLAYER 2</small></span></button>
        </div>
        <div class="qa-credit" aria-live="polite">CREDIT 00</div>
        <div class="qa-tray">
          ${outOf ? '' : `<button type="button" class="qa-coin" data-coin aria-label="Token: drag to the slot, click, or press Enter">${coinSVG(58)}</button>`}
          <div class="qa-count"><span data-n>${n}</span><small>token${n === 1 ? '' : 's'} left</small></div>
        </div>
        <p class="qa-sub" data-note>${outOf ? '' : 'Drag the token into the slot, click it, or press Enter.'}</p>
        ${who ? `<p class="qa-sub" style="opacity:.75">${who}</p>` : ''}
        <div class="qa-row">${outOf ? '<a class="qa-btn qa-pri" href="' + homeHref() + '">Back to the arcade</a>' : ''}<button type="button" class="qa-btn" data-cancel>${outOf ? 'Close' : 'Not now'}</button></div>
      </div>`);
    const el = m.el, slot = el.querySelector('[data-slot]'), coin = el.querySelector('[data-coin]');
    el.querySelector('[data-cancel]').onclick = () => m.close();
    let busy = false, dragged = false;
    function insert() {
      if (busy || outOf) return; busy = true;
      let paid;
      if (server) paid = spendServer();
      else { const w = read(); w.tokens = Math.max(0, w.tokens - 1); w.played = (w.played || 0) + 1; write(w); paid = Promise.resolve(); }
      el.querySelector('[data-n]').textContent = Math.max(0, n - 1);
      const s = el.querySelector('.qa-slit').getBoundingClientRect(), c = coin.getBoundingClientRect();
      const fly = document.createElement('div'); fly.className = 'qa-fly'; fly.innerHTML = coinSVG(58);
      fly.style.left = c.left + 'px'; fly.style.top = c.top + 'px'; (document.fullscreenElement || document.body).appendChild(fly);
      coin.style.visibility = 'hidden';
      coinSound();
      const dx = s.left + s.width / 2 - (c.left + c.width / 2), dy = s.top - (c.top + c.height / 2);
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const done = async () => {
        fly.remove();
        try { await paid; }
        catch (e) {
          const note = el.querySelector('[data-note]'); note.className = 'qa-sub qa-err';
          note.textContent = e.message === 'out' ? 'Your account is out of tokens. They refill tomorrow.' : 'Could not reach the arcade server. Check your connection and try again.';
          coin.style.visibility = ''; busy = false; el.querySelector('[data-n]').textContent = tokens(); return;
        }
        slot.classList.add('qa-hot');
        el.querySelector('.qa-credit').textContent = 'CREDIT 01'; creditSound();
        setTimeout(() => { m.close(); onCredit(); }, reduce ? 150 : 550);
      };
      if (reduce || !fly.animate) { setTimeout(done, 200); return; }
      const a = fly.animate([
        { transform: 'translate(0,0) rotateY(0) scale(1)' },
        { transform: `translate(${dx}px,${dy - 30}px) rotateY(0) scale(.9)`, offset: .55 },
        { transform: `translate(${dx}px,${dy - 20}px) rotateY(80deg) scale(.85)`, offset: .72 },
        { transform: `translate(${dx}px,${dy + 18}px) rotateY(88deg) scale(.8)`, opacity: 1, offset: .9 },
        { transform: `translate(${dx}px,${dy + 30}px) rotateY(88deg) scale(.75)`, opacity: 0 }
      ], { duration: 700, easing: 'cubic-bezier(.3,.7,.4,1)' });
      a.onfinish = done;
    }
    if (!outOf) {
      slot.onclick = insert;
      coin.onclick = () => { if (!dragged) insert(); };
      let drag = null;
      coin.addEventListener('pointerdown', e => { dragged = false; drag = { x: e.clientX, y: e.clientY }; coin.setPointerCapture(e.pointerId); });
      coin.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6) dragged = true; if (dragged) { coin.style.transition = 'none'; coin.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 6}deg)`; } });
      const end = e => {
        if (!drag) return; drag = null;
        if (!dragged) return;
        const s = slot.getBoundingClientRect();
        const over = e.clientX > s.left - 20 && e.clientX < s.right + 20 && e.clientY > s.top - 20 && e.clientY < s.bottom;
        coin.style.transform = ''; coin.style.transition = '';
        if (over) insert(); else setTimeout(() => { dragged = false; }, 0);
      };
      coin.addEventListener('pointerup', end); coin.addEventListener('pointercancel', end);
      m.onKey = e => { if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement && document.activeElement.matches('[data-cancel],a')) return; e.preventDefault(); insert(); } };
      setTimeout(() => coin.focus({ preventScroll: true }), 30);
    } else setTimeout(() => el.querySelector('[data-cancel]').focus(), 30);
  }
  function rootHref() { const p = location.pathname; return p.includes('/games/') ? '../../' : p.includes('/leaderboards/') ? '../' : './'; }
  function homeHref() { return rootHref(); }

  /* ---------- scores ---------- */
  const submitted = new Set();
  async function submitScore(score, game) {
    game = game || gameSlug();
    score = Math.floor(Number(score) || 0);
    if (!game || score <= 0) return;
    const key = game + ':' + score + ':' + Math.floor(Date.now() / 5000);
    if (submitted.has(key)) return; submitted.add(key);
    if (acct.ready) await Promise.race([acct.ready, new Promise(r => setTimeout(r, 2500))]);
    if (signedIn()) {
      const r = await acct.client.rpc('submit_score', { p_game: game, p_score: score });
      if (r.error) toast('Your score could not be saved. Check your connection.');
      else toast(`Score ${score.toLocaleString()} saved to your account. <a href="${rootHref()}leaderboards/#${game}">Leaderboard</a>`);
    } else if (acct.configured && acct.client) {
      const t = toast(`Nice game! <button type="button">Sign in</button> to put scores like ${score.toLocaleString()} on the leaderboard.`);
      t.querySelector('button').onclick = () => { t.remove(); signIn(); };
    }
  }
  async function topScores(game, limit = 10) {
    if (!acct.configured) return { error: 'off' };
    await acct.ready;
    if (!acct.client) return { error: 'net' };
    const r = await acct.client.rpc('top_scores', { p_game: game, p_limit: limit });
    return r.error ? { error: 'net' } : { rows: r.data || [] };
  }

  /* ---------- sign in / account ---------- */
  function signIn() {
    if (open) return;
    if (!acct.configured || !acct.client) {
      const m = modal(`<div class="qa-form" aria-labelledby="qa-st"><h2 id="qa-st">Player accounts</h2>
        <p style="font-size:14px;color:#cfc6b4">${acct.configured ? esc(acct.error || 'Sign-in is starting up. Try again in a moment.') : 'Accounts are not switched on yet. For now your tokens and high scores are saved in this browser.'}</p>
        <div class="qa-row" style="justify-content:flex-start"><button type="button" class="qa-btn qa-pri" data-cancel>OK</button></div></div>`);
      m.el.querySelector('[data-cancel]').onclick = () => m.close(); setTimeout(() => m.el.querySelector('[data-cancel]').focus(), 30); return;
    }
    const m = modal(`<form class="qa-form" aria-labelledby="qa-st" novalidate>
      <h2 id="qa-st">Sign in to Quarter Alley</h2>
      <p style="font-size:14px;color:#cfc6b4">Keep your tokens on every device and put your high scores on the leaderboards. Guests can keep playing without an account.</p>
      <div class="qa-stack">
        <button type="button" class="qa-btn" data-p="google"><svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>
        <button type="button" class="qa-btn" data-p="github"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.6 0 0 3.6 0 8c0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.6 3.9.3.3.5.8.5 1.5v2.2c0 .2.1.5.6.4C13.7 14.5 16 11.5 16 8c0-4.4-3.6-8-8-8z"/></svg>Continue with GitHub</button>
      </div>
      <div class="qa-or">or</div>
      <label>Email<input type="email" id="qa-email" autocomplete="email" placeholder="you@example.com"></label>
      <button type="submit" class="qa-btn qa-pri">Email me a sign-in link</button>
      <p class="qa-msg" id="qa-smsg" aria-live="polite"></p>
      <div class="qa-row" style="justify-content:flex-start"><button type="button" class="qa-btn" data-cancel>Not now</button></div>
    </form>`);
    const el = m.el, $ = s => el.querySelector(s), msg = $('#qa-smsg');
    const back = location.href.split('#')[0];
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = async () => {
      b.disabled = true; msg.className = 'qa-msg'; msg.textContent = 'Opening ' + (b.dataset.p === 'google' ? 'Google' : 'GitHub') + '…';
      const r = await acct.client.auth.signInWithOAuth({ provider: b.dataset.p, options: { redirectTo: back } });
      if (r.error) { b.disabled = false; msg.className = 'qa-msg qa-err'; msg.textContent = 'That sign-in option is not available yet. Try the email link.'; }
    });
    $('form').addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#qa-email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.className = 'qa-msg qa-err'; msg.textContent = 'Enter a full email address, like name@example.com.'; $('#qa-email').focus(); return; }
      const btn = $('button[type=submit]'); btn.disabled = true; msg.className = 'qa-msg'; msg.textContent = 'Sending…';
      const r = await acct.client.auth.signInWithOtp({ email, options: { emailRedirectTo: back } });
      btn.disabled = false;
      if (r.error) { msg.className = 'qa-msg qa-err'; msg.textContent = /rate/i.test(r.error.message) ? 'Too many tries. Wait a minute and send again.' : 'The link could not be sent. Check the address and try again.'; }
      else { msg.className = 'qa-msg'; msg.textContent = `Check ${email} for your sign-in link. You can close this window.`; }
    });
    $('[data-cancel]').onclick = () => m.close();
    setTimeout(() => el.querySelector('[data-p]').focus(), 30);
  }
  function accountMenu() {
    if (open) return;
    if (!signedIn()) { signIn(); return; }
    const w = acct.wallet || { tokens: 0, games_played: 0 };
    const m = modal(`<form class="qa-form" aria-labelledby="qa-at" novalidate>
      <h2 id="qa-at">Your account</h2>
      <p style="font-size:14px;color:#cfc6b4">${esc(acct.user.email || '')}</p>
      <div class="qa-row" style="justify-content:flex-start;gap:18px">
        <div class="qa-count"><span>${w.tokens}</span><small>tokens</small></div>
        <div class="qa-count"><span>${w.games_played || 0}</span><small>games played</small></div>
      </div>
      <label>Display name on leaderboards<input id="qa-name" maxlength="20" value="${esc(displayName())}"></label>
      <p class="qa-msg" id="qa-amsg" aria-live="polite"></p>
      <div class="qa-row" style="justify-content:flex-start">
        <button type="submit" class="qa-btn qa-pri">Save name</button>
        <a class="qa-btn" href="${rootHref()}leaderboards/">Leaderboards</a>
        <button type="button" class="qa-btn" data-out>Sign out</button>
        <button type="button" class="qa-btn" data-cancel>Close</button>
      </div></form>`);
    const el = m.el, $ = s => el.querySelector(s), msg = $('#qa-amsg');
    $('form').addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#qa-name').value.trim();
      if (name.length < 2) { msg.className = 'qa-msg qa-err'; msg.textContent = 'Use at least 2 characters.'; return; }
      const r = await acct.client.from('profiles').update({ display_name: name }).eq('id', acct.user.id);
      if (r.error) { msg.className = 'qa-msg qa-err'; msg.textContent = /unique|duplicate/i.test(r.error.message) ? 'That name is taken. Try another.' : 'The name could not be saved. Try again.'; }
      else { acct.profile = { display_name: name }; msg.className = 'qa-msg'; msg.textContent = 'Saved.'; emit(); }
    });
    $('[data-out]').onclick = async () => { await acct.client.auth.signOut(); acct.user = null; acct.wallet = null; acct.profile = null; emit(); m.close(); toast('Signed out. You are playing as a guest.'); };
    $('[data-cancel]').onclick = () => m.close();
    setTimeout(() => $('#qa-name').focus(), 30);
  }

  /* ---------- bug report ---------- */
  function currentGame() { const t = document.title; return GAMES.find(g => t.includes(g)) || 'Arcade home page'; }
  function reportBug() {
    if (open) return;
    const g = currentGame();
    const m = modal(`<form class="qa-form" aria-labelledby="qa-bt" novalidate>
        <h2 id="qa-bt">Report a bug</h2>
        <label>Game<select id="qa-game">${GAMES.map(x => `<option${x === g ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>What went wrong?<textarea id="qa-what" placeholder="Example: In round 2 the timer froze at 12 and the fight never ended."></textarea></label>
        <label>How can we make it happen again? (optional)<textarea id="qa-steps" placeholder="Steps, the fighter or level, what you pressed…"></textarea></label>
        <p>Sending opens a new issue on GitHub with these details and your browser info filled in. A free GitHub account is needed to submit it. You can also copy the report and send it another way.</p>
        <p class="qa-msg" id="qa-msg"></p>
        <div class="qa-row" style="justify-content:flex-start">
          <a class="qa-btn qa-pri" id="qa-send" href="#" target="_blank" rel="noopener">Open on GitHub</a>
          <button type="button" class="qa-btn" id="qa-copy">Copy report</button>
          <button type="button" class="qa-btn" data-cancel>Cancel</button>
        </div></form>`);
    const el = m.el, $ = s => el.querySelector(s);
    const text = () => {
      const what = $('#qa-what').value.trim(), steps = $('#qa-steps').value.trim();
      return {
        title: `[${$('#qa-game').value}] ${(what.split('\n')[0] || 'Bug report').slice(0, 80)}`,
        body: `**Game:** ${$('#qa-game').value}\n\n**What went wrong:**\n${what || '_(not filled in)_'}\n\n**Steps to reproduce:**\n${steps || '_(not filled in)_'}\n\n---\n- Page: ${location.href.split('#')[0]}\n- Browser: ${navigator.userAgent}\n- Screen: ${screen.width}×${screen.height}, window ${innerWidth}×${innerHeight}\n- Reported: ${new Date().toISOString()}`
      };
    };
    const upd = () => { const t = text(); $('#qa-send').href = `https://github.com/${CONFIG.repo}/issues/new?labels=bug&title=${encodeURIComponent(t.title)}&body=${encodeURIComponent(t.body)}`; };
    ['#qa-what', '#qa-steps', '#qa-game'].forEach(s => $(s).addEventListener('input', upd)); upd();
    $('#qa-send').addEventListener('click', e => { if (!$('#qa-what').value.trim()) { e.preventDefault(); $('#qa-msg').className = 'qa-msg qa-err'; $('#qa-msg').textContent = 'Describe what went wrong first.'; $('#qa-what').focus(); return; } upd(); setTimeout(() => m.close(), 100); });
    $('#qa-copy').onclick = () => {
      const t = text(), s = t.title + '\n\n' + t.body;
      const ok = () => { $('#qa-msg').className = 'qa-msg'; $('#qa-msg').textContent = 'Report copied.'; };
      try { navigator.clipboard.writeText(s).then(ok, () => { $('#qa-what').select(); }); } catch (e) { $('#qa-what').select(); }
    };
    $('[data-cancel]').onclick = () => m.close();
    el.querySelector('form').addEventListener('submit', e => e.preventDefault());
    setTimeout(() => $('#qa-what').focus(), 30);
  }

  /* ---------- toolbar ---------- */
  function chip() {
    const b = document.createElement('span'); b.className = 'qa-chip'; b.title = `Tokens refill to ${CONFIG.dailyTokens} every day`;
    const upd = () => { const n = tokens(); b.innerHTML = `${coinSVG(20)}<span>${freePlay ? 'Free play' : n + ' token' + (n === 1 ? '' : 's')}</span>`; };
    upd(); listeners.push(upd); return b;
  }
  function accountBtn() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'qa-chip';
    const upd = () => { if (signedIn()) { const n = displayName(); b.innerHTML = `<span class="qa-av">${esc(n[0].toUpperCase())}</span>${esc(n)}`; b.style.paddingLeft = '5px'; } else { b.textContent = 'Sign in'; b.style.paddingLeft = ''; } };
    upd(); listeners.push(upd); b.onclick = accountMenu; return b;
  }
  function bugBtn() { const b = document.createElement('button'); b.type = 'button'; b.className = 'qa-chip'; b.textContent = 'Report a bug'; b.onclick = reportBug; return b; }
  function mountBar() {
    const host = document.querySelector('[data-qa-bar]');
    const chips = document.createElement('div'); chips.className = 'qa-chips'; chips.append(chip(), accountBtn(), bugBtn());
    if (host) { host.classList.add('qa-bar'); host.appendChild(chips); return; }
    const back = document.querySelector('a.back');
    if (back) { const bar = document.createElement('div'); bar.className = 'qa-bar'; back.replaceWith(bar); bar.append(back, chips); return; }
    chips.style.cssText = 'position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:9999';
    document.body.appendChild(chips);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBar); else mountBar();
  addEventListener('storage', e => { if (e.key === KEY) emit(); });

  window.Arcade = {
    insertCoin, tokens, reportBug, coinSVG, submitScore, topScores, signIn, accountMenu, toast,
    onChange: f => listeners.push(f),
    get freePlay() { return freePlay; }, get dailyTokens() { return CONFIG.dailyTokens; },
    get accountsOn() { return acct.configured; }, get signedIn() { return signedIn(); }, get playerName() { return signedIn() ? displayName() : null; },
    games: [
      ['stack-shack', 'Stack Shack'], ['prairie-schooner', 'Prairie Schooner'], ['glitch-grid', 'Glitch Grid'], ['sunset-circuit', 'Sunset Circuit'],
      ['spore-storm', 'Spore Storm'], ['rascal-road', 'Rascal Road'], ['iron-treads', 'Iron Treads'], ['starfall', 'Starfall'], ['ridgeline', 'Ridgeline'], ['driftrock', 'Driftrock'], ['lifeline', 'Lifeline']
    ]
  };
})();
