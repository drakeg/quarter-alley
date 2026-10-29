/* Quarter Alley shared arcade layer
 * - Token wallet (stored in the player's browser, refills daily)
 * - Insert-token coin slot overlay: Arcade.insertCoin(callback)
 * - "Report a bug" form that opens a prefilled GitHub issue
 * Include before a game's own script:  <script src="../../assets/arcade.js"></script>
 */
(() => {
  'use strict';
  const CONFIG = {
    startTokens: 10,      // tokens for a brand-new player
    dailyTokens: 10,      // balance is topped up to this once per day
    freePlay: false,      // true = no tokens needed anywhere (also: add ?freeplay to a URL)
    repo: 'drakeg/quarter-alley'
  };
  const GAMES = ['Arcade home page', 'Stack Shack', 'Prairie Schooner', 'Ashfall', 'Glitch Grid', 'Sunset Circuit', 'Spore Storm', 'Rascal Road', 'Iron Treads', 'Starfall'];
  const KEY = 'qa-wallet';
  const freePlay = CONFIG.freePlay || /[?&]freeplay\b/.test(location.search);

  /* ---------- wallet ---------- */
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
  function write(w) { mem = w; try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {} listeners.forEach(f => f(w.tokens)); }
  const listeners = [];
  let wallet = read(); write(wallet);
  const tokens = () => (wallet = read()).tokens;

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

  /* ---------- styles ---------- */
  const css = `
  .qa-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .qa-chips{display:flex;gap:8px;align-items:center}
  .qa-chip{display:inline-flex;align-items:center;gap:6px;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#f4ead2;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:4px 10px 4px 4px;font-variant-numeric:tabular-nums;white-space:nowrap}
  button.qa-chip{cursor:pointer;padding:6px 11px}
  button.qa-chip:hover,button.qa-chip:focus-visible{border-color:#f2b632;outline:none}
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
  .qa-btn{font:600 14px/1 system-ui,sans-serif;color:#f4ead2;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:9px 14px;cursor:pointer;text-decoration:none;display:inline-block}
  .qa-btn:hover,.qa-btn:focus-visible{border-color:#f2b632;outline:none}
  .qa-btn.qa-pri{background:#f2b632;border-color:#f2b632;color:#1b1408}
  .qa-fly{position:fixed;z-index:2147483001;pointer-events:none;line-height:0}
  .qa-form{width:min(100%,480px);background:#1b1d22;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:12px;text-align:left;max-height:100%;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.6)}
  .qa-form h2{margin:0;font:800 22px/1.1 system-ui,sans-serif}
  .qa-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;color:#cfc6b4}
  .qa-form textarea,.qa-form select{font:14px/1.4 system-ui,sans-serif;color:#f4ead2;background:#0f1013;border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:8px}
  .qa-form textarea{min-height:84px;resize:vertical}
  .qa-form textarea:focus-visible,.qa-form select:focus-visible{outline:2px solid #f2b632;outline-offset:1px}
  .qa-form p{margin:0;font-size:12.5px;color:#9a9284;line-height:1.45}
  .qa-msg{color:#7dff8a!important;min-height:1.2em}
  @media (prefers-reduced-motion:reduce){.qa-ready .qa-marq,.qa-ready .qa-slot .qa-lamp{animation:none}.qa-coin{transition:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- insert coin overlay ---------- */
  let open = null;
  function trap(e) {
    if (!open) return;
    e.stopImmediatePropagation();
    if (e.type !== 'keydown') return;
    if (e.key === 'Escape') { e.preventDefault(); open.close(); }
    else if (e.key === 'Tab') {
      const f = [...open.el.querySelectorAll('button,a,textarea,select')].filter(x => !x.disabled && x.offsetParent);
      if (!f.length) return; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    } else if (open.onKey) open.onKey(e);
  }
  ['keydown', 'keyup', 'keypress'].forEach(t => window.addEventListener(t, trap, true));

  function modal(html, cls) {
    const prevFocus = document.activeElement;
    const el = document.createElement('div'); el.className = 'qa-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = html; (document.fullscreenElement || document.body).appendChild(el);
    const m = { el, close() { el.remove(); open = null; try { prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); } catch (e) {} m.onClose && m.onClose(); } };
    el.addEventListener('pointerdown', e => { if (e.target === el) m.close(); });
    open = m; return m;
  }

  function insertCoin(onCredit, opts = {}) {
    ac();
    if (freePlay) { onCredit(); return; }
    if (open) return;
    const n = tokens();
    const outOf = n <= 0;
    const m = modal(`<div class="qa-door ${outOf ? '' : 'qa-ready'}" aria-labelledby="qa-t">
        <p class="qa-marq" id="qa-t">${outOf ? 'OUT OF TOKENS' : 'INSERT TOKEN'}</p>
        <p class="qa-sub">${outOf ? `Your free tokens refill to ${CONFIG.dailyTokens} tomorrow.` : (opts.label || '1 token = 1 game')}</p>
        <div class="qa-slots">
          <button type="button" class="qa-slot ${outOf ? 'qa-off' : ''}" data-slot aria-label="Coin slot: insert a token"><span class="qa-slit"></span><span class="qa-lamp">1 TOKEN<small>PUSH</small></span></button>
          <button type="button" class="qa-slot qa-off" tabindex="-1" aria-hidden="true" disabled><span class="qa-slit"></span><span class="qa-lamp">1 TOKEN<small>PLAYER 2</small></span></button>
        </div>
        <div class="qa-credit" aria-live="polite">CREDIT 00</div>
        <div class="qa-tray">
          ${outOf ? '' : `<button type="button" class="qa-coin" data-coin aria-label="Token: drag to the slot, click, or press Enter">${coinSVG(58)}</button>`}
          <div class="qa-count"><span data-n>${n}</span><small>token${n === 1 ? '' : 's'} left</small></div>
        </div>
        <p class="qa-sub">${outOf ? '' : 'Drag the token into the slot, click it, or press Enter.'}</p>
        <div class="qa-row">${outOf ? '<a class="qa-btn qa-pri" href="' + homeHref() + '">Back to the arcade</a>' : ''}<button type="button" class="qa-btn" data-cancel>${outOf ? 'Close' : 'Not now'}</button></div>
      </div>`);
    const el = m.el, slot = el.querySelector('[data-slot]'), coin = el.querySelector('[data-coin]');
    el.querySelector('[data-cancel]').onclick = () => m.close();
    let busy = false;
    function insert() {
      if (busy || outOf) return; busy = true;
      wallet = read(); wallet.tokens = Math.max(0, wallet.tokens - 1); wallet.played = (wallet.played || 0) + 1; write(wallet);
      el.querySelector('[data-n]').textContent = wallet.tokens;
      const s = el.querySelector('.qa-slit').getBoundingClientRect(), c = coin.getBoundingClientRect();
      const fly = document.createElement('div'); fly.className = 'qa-fly'; fly.innerHTML = coinSVG(58);
      fly.style.left = c.left + 'px'; fly.style.top = c.top + 'px'; (document.fullscreenElement || document.body).appendChild(fly);
      coin.style.visibility = 'hidden';
      coinSound();
      const dx = s.left + s.width / 2 - (c.left + c.width / 2), dy = s.top - (c.top + c.height / 2);
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const done = () => {
        fly.remove(); slot.classList.add('qa-hot');
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
      // drag the token to the slot
      let drag = null, dragged = false;
      coin.addEventListener('pointerdown', e => { dragged = false; const r = coin.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, ox: r.left, oy: r.top }; coin.setPointerCapture(e.pointerId); });
      coin.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6) dragged = true; if (dragged) { coin.style.transition = 'none'; coin.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 6}deg)`; } });
      const end = e => {
        if (!drag) return; const was = drag; drag = null;
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

  function homeHref() { const s = document.currentScript; return location.pathname.includes('/games/') ? '../../' : './'; }

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
    $('#qa-send').addEventListener('click', e => { if (!$('#qa-what').value.trim()) { e.preventDefault(); $('#qa-msg').style.color = '#ff8a6a'; $('#qa-msg').textContent = 'Describe what went wrong first.'; $('#qa-what').focus(); return; } upd(); setTimeout(() => m.close(), 100); });
    $('#qa-copy').onclick = () => {
      const t = text(), s = t.title + '\n\n' + t.body;
      const ok = () => { $('#qa-msg').style.color = ''; $('#qa-msg').textContent = 'Report copied.'; };
      try { navigator.clipboard.writeText(s).then(ok, () => { $('#qa-what').select(); }); } catch (e) { $('#qa-what').select(); }
    };
    $('[data-cancel]').onclick = () => m.close();
    el.querySelector('form').addEventListener('submit', e => e.preventDefault());
    setTimeout(() => $('#qa-what').focus(), 30);
  }

  /* ---------- toolbar ---------- */
  function chip() {
    const b = document.createElement('span'); b.className = 'qa-chip'; b.title = `Tokens refill to ${CONFIG.dailyTokens} every day`;
    const upd = () => { b.innerHTML = `${coinSVG(20)}<span>${freePlay ? 'Free play' : tokens() + ' token' + (tokens() === 1 ? '' : 's')}</span>`; };
    upd(); listeners.push(upd); return b;
  }
  function bugBtn() { const b = document.createElement('button'); b.type = 'button'; b.className = 'qa-chip'; b.textContent = 'Report a bug'; b.onclick = reportBug; return b; }
  function mountBar() {
    let host = document.querySelector('[data-qa-bar]');
    const chips = document.createElement('div'); chips.className = 'qa-chips'; chips.append(chip(), bugBtn());
    if (host) { host.classList.add('qa-bar'); host.appendChild(chips); return; }
    const back = document.querySelector('a.back');
    if (back) { const bar = document.createElement('div'); bar.className = 'qa-bar'; back.replaceWith(bar); bar.append(back, chips); return; }
    chips.style.cssText = 'position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:9999';
    document.body.appendChild(chips);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBar); else mountBar();
  addEventListener('storage', e => { if (e.key === KEY) listeners.forEach(f => f(tokens())); });

  window.Arcade = { insertCoin, tokens, reportBug, coinSVG, onChange: f => listeners.push(f), get freePlay() { return freePlay; }, get dailyTokens() { return CONFIG.dailyTokens; } };
})();
