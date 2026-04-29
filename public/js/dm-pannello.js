/**
 * INFERNO RPG — DM PANNELLO JS
 * Logica Firebase + Rendering + Stato sessione DM
 * Pattern identico a firebase-schede.js
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── FIREBASE CONFIG (stessa di firebase-schede.js) ──
const firebaseConfig = {
  apiKey:            'AIzaSyAFtzNu6mzRI58umWN3-Y40o0UiI2YYPe8',
  authDomain:        'inferno-schede.firebaseapp.com',
  projectId:         'inferno-schede',
  storageBucket:     'inferno-schede.firebasestorage.app',
  messagingSenderId: '368915835108',
  appId:             '1:368915835108:web:43f8cbc47d5cb1f620a4f1'
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const LOCAL_KEY = 'inferno_dm_sessione';

// ════════════════════════════════════════════
// STATO GLOBALE
// ════════════════════════════════════════════
window.DM = {
  theme: 'ember',
  round: 1,
  tension: 0,
  currentTurn: 0,
  cerchioAttuale: 'antinferno',
  _savedAt: '',

  combattenti: [],
  png: [],
  anime: [],

  xpCur: 0,
  xpLivelli: [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000],

  milestones: [],
  xpLog: [],
  inventario: [],
  bm: [],

  note: ''
};

let nextId = 200;
const uid = () => ++nextId;

// ════════════════════════════════════════════
// FIREBASE SAVE / LOAD
// ════════════════════════════════════════════
function setStatus(txt, color) {
  const m = document.getElementById('sv-msg');
  if (!m) return;
  m.textContent = txt;
  m.style.color = color || 'var(--g)';
  m.classList.add('show');
}
function hideStatus() {
  setTimeout(() => {
    const m = document.getElementById('sv-msg');
    if (m) m.classList.remove('show');
  }, 2500);
}

async function dmSave(data) {
  try {
    const user = auth.currentUser;
    if (!user) { setStatus('⚠ Non autenticato', '#e06060'); return; }
    const now = new Date().toISOString();
    data._savedAt = now;
    const docId = user.uid + '_dm_sessione';
    await setDoc(doc(db, 'schede', docId), {
      uid: user.uid,
      data: JSON.stringify(data),
      updatedAt: now
    });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    setStatus('☁ Salvato ✓', 'var(--g)');
    hideStatus();
  } catch (err) {
    console.error('dmSave error:', err);
    setStatus('⚠ Errore salvataggio', '#e06060');
  }
}

async function dmLoad(user) {
  try {
    const docId = user.uid + '_dm_sessione';
    const snap = await getDoc(doc(db, 'schede', docId));
    if (snap.exists()) {
      const cloudData = JSON.parse(snap.data().data);
      const cloudTime = snap.data().updatedAt || '';
      const localRaw = localStorage.getItem(LOCAL_KEY);
      const local = localRaw ? JSON.parse(localRaw) : null;
      const useCloud = !local || cloudTime > (local._savedAt || '');
      if (useCloud) {
        window.DM = cloudData;
        applyAll();
        setStatus('☁ Sessione Cloud Caricata', 'var(--g)');
        hideStatus();
        return;
      }
    }
    // Fallback: carica da localStorage
    const localRaw = localStorage.getItem(LOCAL_KEY);
    if (localRaw) {
      window.DM = JSON.parse(localRaw);
      applyAll();
    }
  } catch (err) {
    console.error('dmLoad error:', err);
  }
}

// Espongo la funzione di salvataggio globalmente
window._dmSave = dmSave;

// Autosave ogni 60s (stesso pattern di firebase-schede.js)
setInterval(() => {
  if (auth.currentUser && window.DM) {
    collect();
    dmSave(window.DM);
  }
}, 60000);

// ── AUTH STATE ──
onAuthStateChanged(auth, (user) => {
  const brand = document.querySelector('.toolbar-brand');
  if (user) {
    if (brand) brand.title = 'DM: ' + user.email;
    dmLoad(user);
  } else {
    // Redirect alla home se non autenticato
    window.location.href = '/';
  }
});

// ════════════════════════════════════════════
// COLLECT (legge DOM → DM)
// ════════════════════════════════════════════
window.collect = function() {
  const DM = window.DM;
  DM.round = parseInt(document.getElementById('round-num')?.textContent) || 1;
  DM.xpCur = parseInt(document.getElementById('xp-cur')?.value) || 0;
  DM.note  = document.getElementById('note-priv')?.value || '';
};

// ════════════════════════════════════════════
// SALVA (bottone)
// ════════════════════════════════════════════
window.dmSalva = function() {
  collect();
  const now = new Date().toISOString();
  window.DM._savedAt = now;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(window.DM));
  if (auth.currentUser) dmSave(window.DM);
  else { setStatus('💾 Salvato in locale', 'var(--g)'); hideStatus(); }
};

// ════════════════════════════════════════════
// ROUND & TENSIONE
// ════════════════════════════════════════════
window.changeRound = function(delta) {
  window.DM.round = Math.max(1, (window.DM.round || 1) + delta);
  document.getElementById('round-num').textContent = window.DM.round;
};

window.setTension = function(v) {
  window.DM.tension = v;
  renderTension();
};

function renderTension() {
  const v = window.DM.tension || 0;
  document.querySelectorAll('.tension-pip').forEach((pip, i) => {
    pip.classList.remove('on-low', 'on-mid', 'on-high');
    if (i < v) {
      pip.classList.add(i < 3 ? 'on-low' : i < 7 ? 'on-mid' : 'on-high');
    }
  });
  const el = document.getElementById('tension-val');
  if (el) el.textContent = v;
}

// ════════════════════════════════════════════
// TEMA
// ════════════════════════════════════════════
window.setTheme = function(name, btn) {
  document.body.className = 't-' + name;
  window.DM.theme = name;
  document.querySelectorAll('.tdot').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
};

// ════════════════════════════════════════════
// TRACKER INIZIATIVA
// ════════════════════════════════════════════
const STATI = ['Avvelenato','Stordito','Spaventato','Accecato','Esausto','Concentrato'];
const STATI_CL = ['on-r','on-r','on-b','on-r','on-b','on-g'];

function sortInit() {
  window.DM.combattenti.sort((a, b) => b.init - a.init);
}

window.rInit = function() {
  sortInit();
  const tb = document.getElementById('init-tbody');
  if (!tb) return;
  tb.innerHTML = '';
  const DM = window.DM;
  const activeTurn = DM.currentTurn % Math.max(1, DM.combattenti.length);

  DM.combattenti.forEach((c, i) => {
    const isActive = i === activeTurn;
    const pct = c.pfMax > 0 ? Math.max(0, Math.min(100, (c.pfCur / c.pfMax) * 100)) : 0;
    const hpCol = pct > 60 ? '#2a7c2a' : pct > 30 ? '#a07820' : '#881818';
    const tr = document.createElement('tr');
    tr.className = isActive ? 'turn-active' : '';
    tr.draggable = true;
    tr.dataset.idx = i;

    tr.innerHTML = `
      <td style="width:28px">
        <span class="drag-grip">⠿</span>
        ${isActive ? '<span class="turn-dot" style="display:inline-block;margin-left:2px"></span>' : ''}
      </td>
      <td style="width:34px"><input class="i-num" type="number" value="${c.init}" onchange="DM.combattenti[${i}].init=+this.value;window.rInit()"></td>
      <td><input class="i-name" value="${esc(c.nome)}" onchange="DM.combattenti[${i}].nome=this.value" placeholder="Nome..."></td>
      <td style="width:122px">
        <div class="hp-wrap">
          <input class="i-hp" type="number" value="${c.pfCur}" onchange="DM.combattenti[${i}].pfCur=+this.value;window.rInit()">
          <span class="hp-max-lbl">/</span>
          <input class="i-hp hp-max-in" type="number" value="${c.pfMax}" onchange="DM.combattenti[${i}].pfMax=+this.value;window.rInit()">
        </div>
        <div class="hp-micro"><div class="hp-micro-fill" style="width:${pct}%;background:${hpCol}"></div></div>
      </td>
      <td>
        <div class="cond-row">${STATI.map((s, si) => {
          const on = c.stati?.includes(si);
          const cl = on ? `on-${STATI_CL[si].replace('on-','')}` : '';
          return `<span class="cond-pill ${cl}" onclick="toggleStato(${i},${si},this)">${s}</span>`;
        }).join('')}</div>
      </td>
      <td style="width:24px"><button class="del-btn" onclick="DM.combattenti.splice(${i},1);window.rInit()">✕</button></td>
    `;

    // Drag & drop
    tr.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); tr.classList.add('dragging'); });
    tr.addEventListener('dragend', () => { tr.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over')); });
    tr.addEventListener('dragover', e => { e.preventDefault(); tr.classList.add('drag-over'); });
    tr.addEventListener('dragleave', () => tr.classList.remove('drag-over'));
    tr.addEventListener('drop', e => {
      e.preventDefault(); tr.classList.remove('drag-over');
      const from = +e.dataTransfer.getData('text/plain');
      if (from !== i) { const tmp = DM.combattenti.splice(from, 1)[0]; DM.combattenti.splice(i, 0, tmp); window.rInit(); }
    });

    tb.appendChild(tr);
  });
};

window.toggleStato = function(ci, si, el) {
  const c = window.DM.combattenti[ci];
  if (!c.stati) c.stati = [];
  const idx = c.stati.indexOf(si);
  if (idx >= 0) c.stati.splice(idx, 1); else c.stati.push(si);
  window.rInit();
};

window.nextTurn = function() {
  const DM = window.DM;
  DM.currentTurn = (DM.currentTurn + 1) % Math.max(1, DM.combattenti.length);
  if (DM.currentTurn === 0) { DM.round++; document.getElementById('round-num').textContent = DM.round; }
  window.rInit();
};

window.addCombattente = function() {
  window.DM.combattenti.push({ id: uid(), init: 10, nome: '', pfCur: 10, pfMax: 10, stati: [], tipo: 'nemico' });
  window.rInit();
};

// ════════════════════════════════════════════
// PNG
// ════════════════════════════════════════════
const REL_CYCLE = ['ostile', 'neutrale', 'alleato'];
const REL_CL = { ostile: 'rel-ostile', neutrale: 'rel-neutrale', alleato: 'rel-alleato' };

window.rPng = function() {
  const c = document.getElementById('png-list');
  if (!c) return;
  c.innerHTML = '';
  window.DM.png.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = `png-item ${p.rel}`;
    d.innerHTML = `
      <div class="png-top">
        <input class="png-name" value="${esc(p.nome)}" onchange="DM.png[${i}].nome=this.value" placeholder="Nome PNG...">
        <span class="rel-badge ${REL_CL[p.rel]}" onclick="cycleRel(${i},this)">${p.rel}</span>
        <button class="del-btn" style="opacity:.6" onclick="DM.png.splice(${i},1);window.rPng()">✕</button>
      </div>
      <div class="png-row2">
        <input class="cell-in png-role" value="${esc(p.ruolo)}" onchange="DM.png[${i}].ruolo=this.value" placeholder="Ruolo..." style="font-style:italic;color:var(--ink3)">
        <span style="font-size:10px;color:var(--ink3);white-space:nowrap">PF:</span>
        <input class="cell-in" value="${esc(p.hp)}" onchange="DM.png[${i}].hp=this.value" style="width:36px;text-align:center;font-family:'Cormorant SC',serif" placeholder="—">
      </div>
      <input class="cell-in" value="${esc(p.note)}" onchange="DM.png[${i}].note=this.value" placeholder="Note segrete..." style="margin-top:4px;font-size:11px;color:var(--ink3);font-style:italic">
    `;
    c.appendChild(d);
  });
};

window.cycleRel = function(i, el) {
  const cur = REL_CYCLE.indexOf(window.DM.png[i].rel || 'neutrale');
  const next = REL_CYCLE[(cur + 1) % 3];
  window.DM.png[i].rel = next;
  el.className = `rel-badge ${REL_CL[next]}`;
  el.textContent = next;
  el.closest('.png-item').className = `png-item ${next}`;
};

window.addPng = function() {
  window.DM.png.push({ id: uid(), nome: '', ruolo: '', hp: '10', rel: 'neutrale', note: '' });
  window.rPng();
};

// ════════════════════════════════════════════
// CERCHI INFERNALI
// ════════════════════════════════════════════
const CERCHI = [
  { k: 'antinferno', n: 'Antinferno',         pec: 'Ignavi — vespe e vermi' },
  { k: 'I',          n: 'I · Limbo',           pec: 'Virtù senza battesimo' },
  { k: 'II',         n: 'II · Lussuriosi',     pec: 'Vento perpetuo' },
  { k: 'III',        n: 'III · Golosi',        pec: 'Fango e pioggia nera' },
  { k: 'IV',         n: 'IV · Avari & Prodighi', pec: 'Pesi eterni' },
  { k: 'V',          n: 'V · Iracondi',        pec: 'Palude Stigia' },
  { k: 'VI',         n: 'VI · Eretici',        pec: 'Tombe infuocate' },
  { k: 'VII',        n: 'VII · Violenti',      pec: 'Sangue, rovi, sabbia' },
  { k: 'VIII',       n: 'VIII · Fraudolenti',  pec: 'Malebolge' },
  { k: 'IX',         n: 'IX · Traditori',      pec: 'Cocito ghiacciato' }
];

window.rCerchi = function() {
  const c = document.getElementById('cerchi-list');
  if (!c) return;
  c.innerHTML = '';
  CERCHI.forEach(cer => {
    const isCur = cer.k === window.DM.cerchioAttuale;
    const d = document.createElement('div');
    d.className = `cerchio-item${isCur ? ' current' : ''}`;
    d.onclick = () => { window.DM.cerchioAttuale = cer.k; window.rCerchi(); };
    d.innerHTML = `
      ${isCur ? '<span class="current-marker"></span>' : '<span style="width:6px;flex-shrink:0"></span>'}
      <span class="cerchio-num">${cer.k === 'antinferno' ? '✦' : cer.k}</span>
      <span class="cerchio-name">${cer.n}</span>
      <span class="cerchio-pec">${cer.pec}</span>
    `;
    c.appendChild(d);
  });
};

// ════════════════════════════════════════════
// ANIME
// ════════════════════════════════════════════
const ESITO_CYCLE = ['ricompensa', 'punizione', 'ignota'];
const ESITO_CL = { ricompensa: 'esito-ric', punizione: 'esito-pun', ignota: 'esito-ign' };

window.rAnime = function() {
  const c = document.getElementById('anime-list');
  if (!c) return;
  c.innerHTML = '';
  window.DM.anime.forEach((a, i) => {
    const d = document.createElement('div');
    d.className = 'anima-item';
    d.innerHTML = `
      <div class="anima-top">
        <input class="cell-in" value="${esc(a.nome)}" onchange="DM.anime[${i}].nome=this.value" placeholder="Nome anima..." style="font-weight:500;font-size:13px">
        <span class="esito-pill ${ESITO_CL[a.esito]}" onclick="cycleEsito(${i},this)">${a.esito}</span>
        <button class="del-btn" style="opacity:.6" onclick="DM.anime.splice(${i},1);window.rAnime()">✕</button>
      </div>
      <input class="cell-in" value="${esc(a.peccato)}" onchange="DM.anime[${i}].peccato=this.value" placeholder="Peccato dantesco..." style="font-style:italic;color:var(--ink3);margin-bottom:2px">
      <input class="cell-in" value="${esc(a.note||'')}" onchange="DM.anime[${i}].note=this.value" placeholder="Note..." style="font-size:11px;color:var(--ink3)">
    `;
    c.appendChild(d);
  });
};

window.cycleEsito = function(i, el) {
  const cur = ESITO_CYCLE.indexOf(window.DM.anime[i].esito || 'ignota');
  const next = ESITO_CYCLE[(cur + 1) % 3];
  window.DM.anime[i].esito = next;
  el.className = `esito-pill ${ESITO_CL[next]}`;
  el.textContent = next;
};

window.addAnima = function() {
  window.DM.anime.push({ id: uid(), nome: '', peccato: '', esito: 'ignota', note: '' });
  window.rAnime();
};

// ════════════════════════════════════════════
// XP
// ════════════════════════════════════════════
function getLvl(xp) {
  const lvls = window.DM.xpLivelli;
  for (let i = lvls.length - 1; i >= 0; i--) { if (xp >= lvls[i]) return i; }
  return 1;
}

window.rXP = function() {
  const DM = window.DM;
  const xp = DM.xpCur || 0;
  const lvl = getLvl(xp);
  const cur = DM.xpLivelli[lvl] || 0;
  const nxt = DM.xpLivelli[lvl + 1] || DM.xpLivelli[DM.xpLivelli.length - 1];
  const pct = nxt > cur ? ((xp - cur) / (nxt - cur)) * 100 : 100;
  const bar = document.getElementById('xp-bar-fill');
  const nxtEl = document.getElementById('xp-nxt');
  const lvlEl = document.getElementById('xp-lvl-lbl');
  if (bar) bar.style.width = Math.min(100, pct) + '%';
  if (nxtEl) nxtEl.textContent = nxt.toLocaleString('it');
  if (lvlEl) lvlEl.textContent = `Livello ${lvl}`;
};

window.rMilestones = function() {
  const c = document.getElementById('ms-list');
  if (!c) return;
  c.innerHTML = '';
  window.DM.milestones.forEach((m, i) => {
    const d = document.createElement('div');
    d.className = 'ms-item';
    d.innerHTML = `
      <div class="ms-check${m.done ? ' on' : ''}" onclick="DM.milestones[${i}].done=!DM.milestones[${i}].done;window.rMilestones()"></div>
      <input class="ms-txt${m.done ? ' done' : ''}" value="${esc(m.txt)}" onchange="DM.milestones[${i}].txt=this.value" placeholder="Milestone...">
      <button class="del-btn" style="opacity:.6" onclick="DM.milestones.splice(${i},1);window.rMilestones()">✕</button>
    `;
    c.appendChild(d);
  });
};

window.addMilestone = function() {
  window.DM.milestones.push({ done: false, txt: '' });
  window.rMilestones();
};

window.rXpLog = function() {
  const c = document.getElementById('xp-log-list');
  if (!c) return;
  c.innerHTML = '';
  [...window.DM.xpLog].reverse().forEach((e, i) => {
    const d = document.createElement('div');
    d.className = 'xp-log-item';
    d.innerHTML = `
      <span class="xp-log-v">+${e.v}</span>
      <span class="xp-log-d">${esc(e.desc)}</span>
      <button class="del-btn" style="opacity:.6" onclick="DM.xpLog.splice(DM.xpLog.length-1-${i},1);window.rXpLog()">✕</button>
    `;
    c.appendChild(d);
  });
};

window.addXpLog = function() {
  const vStr = prompt('XP guadagnati:', '100');
  const v = parseInt(vStr);
  if (!v) return;
  const desc = prompt('Descrizione:', 'Incontro superato') || '';
  window.DM.xpLog.push({ v, desc });
  window.DM.xpCur += v;
  const inp = document.getElementById('xp-cur');
  if (inp) inp.value = window.DM.xpCur;
  window.rXP();
  window.rXpLog();
};

// ════════════════════════════════════════════
// INVENTARIO
// ════════════════════════════════════════════
const TAG_CYCLE = ['obj', 'tesoro', 'oro'];
const TAG_LABELS = { obj: 'Oggetto', tesoro: 'Tesoro', oro: 'Oro' };
const TAG_CL = { obj: 'inv-obj', tesoro: 'inv-tesoro', oro: 'inv-oro' };

window.rInv = function() {
  const c = document.getElementById('inv-list');
  if (!c) return;
  c.innerHTML = '';
  window.DM.inventario.forEach((it, i) => {
    const d = document.createElement('div');
    d.className = 'inv-row';
    d.innerHTML = `
      <input class="cell-in" value="${esc(it.nome)}" onchange="DM.inventario[${i}].nome=this.value" placeholder="Oggetto..." style="flex:1">
      <input class="inv-qty" value="${esc(it.qty)}" onchange="DM.inventario[${i}].qty=this.value" placeholder="1">
      <span class="inv-tag ${TAG_CL[it.tag||'obj']}" onclick="cycleTag(${i},this)" style="cursor:pointer">${TAG_LABELS[it.tag||'obj']}</span>
      <button class="del-btn" onclick="DM.inventario.splice(${i},1);window.rInv()">✕</button>
    `;
    c.appendChild(d);
  });
};

window.cycleTag = function(i, el) {
  const cur = TAG_CYCLE.indexOf(window.DM.inventario[i].tag || 'obj');
  const next = TAG_CYCLE[(cur + 1) % TAG_CYCLE.length];
  window.DM.inventario[i].tag = next;
  el.className = `inv-tag ${TAG_CL[next]}`;
  el.textContent = TAG_LABELS[next];
};

window.addInv = function() {
  window.DM.inventario.push({ nome: '', qty: '1', tag: 'obj' });
  window.rInv();
};

// ════════════════════════════════════════════
// BENEDIZIONI & MALEDIZIONI
// ════════════════════════════════════════════
window.rBM = function() {
  const c = document.getElementById('bm-list');
  if (!c) return;
  c.innerHTML = '';
  window.DM.bm.forEach((b, i) => {
    const d = document.createElement('div');
    d.className = 'bm-row';
    d.innerHTML = `
      <div class="bm-dot ${b.tipo}"></div>
      <input class="cell-in" value="${esc(b.nome)}" onchange="DM.bm[${i}].nome=this.value" placeholder="Nome..." style="flex:1">
      <input class="bm-dur" value="${esc(b.dur||'—')}" onchange="DM.bm[${i}].dur=this.value" placeholder="Durata" title="Durata in round/sessioni">
      <button class="del-btn" onclick="DM.bm.splice(${i},1);window.rBM()">✕</button>
    `;
    c.appendChild(d);
  });
};

window.addBM = function(tipo) {
  window.DM.bm.push({ tipo, nome: tipo === 'b' ? 'Benedizione' : 'Maledizione', dur: '∞' });
  window.rBM();
};

// ════════════════════════════════════════════
// NOTE & TAG
// ════════════════════════════════════════════
window.insertTag = function(tag) {
  const ta = document.getElementById('note-priv');
  if (!ta) return;
  const s = ta.selectionStart;
  ta.value = ta.value.substring(0, s) + tag + ' ' + ta.value.substring(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = s + tag.length + 1;
  ta.focus();
  window.DM.note = ta.value;
};

// ════════════════════════════════════════════
// APPLY ALL (DOM ← DM)
// ════════════════════════════════════════════
function applyAll() {
  const DM = window.DM;
  const roundEl = document.getElementById('round-num');
  if (roundEl) roundEl.textContent = DM.round || 1;
  const xpEl = document.getElementById('xp-cur');
  if (xpEl) xpEl.value = DM.xpCur || 0;
  const noteEl = document.getElementById('note-priv');
  if (noteEl) noteEl.value = DM.note || '';
  // Tema
  if (DM.theme && DM.theme !== 'custom') {
    document.body.className = 't-' + DM.theme;
    document.querySelectorAll('.tdot').forEach(b => b.classList.remove('on'));
    const btn = document.querySelector(`[data-t="${DM.theme}"]`);
    if (btn) btn.classList.add('on');
  }
  renderTension();
  window.rInit();
  window.rPng();
  window.rCerchi();
  window.rAnime();
  window.rXP();
  window.rMilestones();
  window.rXpLog();
  window.rInv();
  window.rBM();
}
window.applyAll = applyAll;

// ════════════════════════════════════════════
// EXPORT / IMPORT JSON
// ════════════════════════════════════════════
window.exportJSON = function() {
  collect();
  const blob = new Blob([JSON.stringify(window.DM, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Inferno_DM_Sessione.json';
  a.click();
};

window.importJSON = function(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try { window.DM = JSON.parse(ev.target.result); applyAll(); }
    catch { alert("File JSON non valido."); }
  };
  r.readAsText(f);
  e.target.value = '';
};

// ════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Autosave su unload
window.addEventListener('beforeunload', () => {
  collect();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(window.DM));
});

// ════════════════════════════════════════════
// INIT (a DOM pronto)
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Carica da localStorage come fallback istantaneo
  const localRaw = localStorage.getItem(LOCAL_KEY);
  if (localRaw) {
    try { window.DM = JSON.parse(localRaw); } catch {}
  }
  applyAll();
  // Tema iniziale
  document.body.className = 't-' + (window.DM.theme || 'ember');
  const initBtn = document.querySelector(`[data-t="${window.DM.theme || 'ember'}"]`);
  if (initBtn) initBtn.classList.add('on');
});