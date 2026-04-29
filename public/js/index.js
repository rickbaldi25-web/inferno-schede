import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAFtzNu6mzRI58umWN3-Y40o0UiI2YYPe8",
  authDomain:        "inferno-schede.firebaseapp.com",
  projectId:         "inferno-schede",
  storageBucket:     "inferno-schede.firebasestorage.app",
  messagingSenderId: "368915835108",
  appId:             "1:368915835108:web:43f8cbc47d5cb1f620a4f1"
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ── Audio ─────────────────────────────────── */
const audio    = document.getElementById('bg-audio');
const musicBtn = document.getElementById('music-btn');
let isPlaying  = false;
if (audio && musicBtn) {
  audio.volume = 0.3;
  musicBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      musicBtn.textContent = '🔇';
      musicBtn.classList.remove('playing');
    } else {
      audio.play().catch(() => {});
      musicBtn.textContent = '🔊';
      musicBtn.classList.add('playing');
    }
    isPlaying = !isPlaying;
  });
}

/* ── Embers ─────────────────────────────────── */
(function initEmbers() {
  const c = document.getElementById('embers');
  if (!c) return;
  const colors = ['#c49830','#A07820','#8B0000','#b01010','#d4a830'];
  for (let i = 0; i < 30; i++) {
    const e = document.createElement('div');
    e.className = 'ember';
    const size = 1 + Math.random() * 3;
    e.style.cssText = [
      `--x:${Math.random()*100}%`,
      `--dur:${5+Math.random()*9}s`,
      `--delay:${Math.random()*12}s`,
      `--drift:${(Math.random()-.5)*100}px`,
      `width:${size}px`, `height:${size}px`,
      `background:${colors[Math.floor(Math.random()*colors.length)]}`,
      `box-shadow:0 0 ${size*2}px ${colors[0]}`
    ].join(';');
    c.appendChild(e);
  }
})();

/* ── Card helpers ───────────────────────────── */
window.creaNuovaScheda = function() {
  window.location.href = `/src/Inferno_Scheda_Generica?id=sheet_${Date.now()}`;
};

window.cancellaScheda = async function(idDocumento, event) {
  event.preventDefault(); event.stopPropagation();
  if (confirm("Sei sicuro di voler abbandonare questo Smarrito nel baratro? La scheda verrà eliminata per sempre.")) {
    try {
      await deleteDoc(doc(db, "schede", idDocumento));
      alert("Scheda eliminata. Il suo viaggio si interrompe qui.");
      location.reload();
    } catch {
      alert("L'Inferno trattiene questa anima: errore durante l'eliminazione.");
    }
  }
};

function buildCard({ href, num, name, subtitle = '', tags = [], pfCur = null, pfMax = null, deleteId = null }) {
  const el = document.createElement(href ? 'a' : 'div');
  if (href) el.href = href;
  el.className = 'scheda-card';

  const pfPct  = (pfCur !== null && pfMax) ? Math.max(0, Math.min(1, pfCur / pfMax)) : null;
  const pfFill = pfPct !== null ? `<div class="card-pf">
    <span class="card-pf-label">PF</span>
    <div class="card-pf-track"><div class="card-pf-fill" style="width:${pfPct*100}%"></div></div>
    <span class="card-pf-text">${pfCur}/${pfMax}</span>
  </div>` : '';

  const tagsHtml = tags.length
    ? `<div class="card-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
    : '';

  const delBtn = deleteId
    ? `<button class="del-card-btn" title="Elimina" onclick="window.cancellaScheda('${deleteId}', event)">✕</button>`
    : '';

  el.innerHTML = `
    ${delBtn}
    <div class="card-inner">
      <div class="card-avatar">👤</div>
      <div class="card-body">
        <span class="card-num">${num}</span>
        <h2 class="card-name">${name}</h2>
        ${subtitle ? `<div class="card-subtitle">${subtitle}</div>` : ''}
        ${tagsHtml}
        ${pfFill}
      </div>
    </div>
    <div class="card-footer">
      <span class="card-cta">Apri Viaggio</span>
    </div>`;
  return el;
}

/* ── Auth ───────────────────────────────────── */
const btnLogin  = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
if (btnLogin)  btnLogin.onclick  = () => { if (!isPlaying && musicBtn) musicBtn.click(); signInWithPopup(auth, provider); };
if (btnLogout) btnLogout.onclick = () => signOut(auth).then(() => location.reload());

let isRendering = false;

onAuthStateChanged(auth, async (user) => {
  const grid = document.getElementById('cards-grid');
  if (!grid || isRendering) return;

  if (user) {
    isRendering = true;
    if (btnLogin)  btnLogin.style.display  = 'none';
    if (btnLogout) btnLogout.style.display = 'inline-block';

    grid.innerHTML = '';

    /* ── + Nuovo slot ─────────────────────────── */
    const cardNew = document.createElement('div');
    cardNew.className = 'scheda-card card-new';
    cardNew.onclick = window.creaNuovaScheda;
    cardNew.innerHTML = `<div class="card-new-icon">+</div><div class="card-new-label">Nuovo Smarrito</div>`;
    grid.appendChild(cardNew);

    /* ── Schede Firestore + Bartolomeo ────────────── */
    let bartPf = null, bartPfx = null;
    try {
      const q  = query(collection(db, 'schede'), where('uid', '==', user.uid));
      const qs = await getDocs(q);
      const seen = new Set();
      qs.forEach(snap => {
        if (snap.id.includes('dm_sessione')) return;
        if (snap.id.includes('bartolomeo')) {
          try {
            const parsed = JSON.parse(snap.data().data || '{}');
            bartPf  = parsed.pf  !== undefined ? parseInt(parsed.pf)  : null;
            bartPfx = parsed.pfx !== undefined ? parseInt(parsed.pfx) : null;
          } catch {}
          return;
        }
        if (seen.has(snap.id)) return;
        seen.add(snap.id);
        const d = snap.data();
        const idScheda = snap.id.substring(user.uid.length + 1);
        grid.appendChild(buildCard({
          href:     `/src/Inferno_Scheda_Generica?id=${idScheda}`,
          num:      'Smarrito',
          name:     d.nome || 'Senza Nome',
          subtitle: d.classe || '',
          pfCur:    d.pf   ?? null,
          pfMax:    d.pfMax ?? null,
          deleteId: snap.id,
        }));
      });
    } catch (e) { console.error(e); }
    finally { isRendering = false; }

    /* ── Scheda Bartolomeo (hardcoded con HP live) ── */
    if (user.email === 'rickbaldi25@gmail.com') {
      grid.insertBefore(buildCard({
        href:     '/src/Bartolomeo_Scheda',
        num:      'Scheda 01',
        name:     'Bartolomeo',
        subtitle: 'Lo Schiavo · Monaco Lv.2',
        tags:     ['Ignavia', 'Antinferno'],
        pfCur:    bartPf,
        pfMax:    bartPfx,
      }), grid.children[1] ?? null);
    }

    /* ── Pannello DM ───────────────────────────── */
    const cardDm = document.createElement('a');
    cardDm.className = 'scheda-card card-traghettatore';
    cardDm.href = '/src/DM_Pannello';
    cardDm.innerHTML = `
      <div class="card-inner">
        <div class="card-avatar" style="border-radius:50%;border-color:rgba(160,120,32,0.4)">⚔</div>
        <div class="card-body">
          <span class="card-num">Sessione</span>
          <h2 class="card-name">Pannello Traghettatore</h2>
          <div class="card-subtitle">Gestisci combattimento, cerchi e PNG</div>
        </div>
      </div>
      <div class="card-footer" style="border-top:none;border-left:1px solid var(--border);min-width:160px;justify-content:center;">
        <span class="card-cta">Apri Sessione</span>
      </div>`;
    grid.appendChild(cardDm);

  } else {
    if (btnLogin)  btnLogin.style.display  = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'none';
    grid.innerHTML = `
      <div class="cards-empty">
        <div class="cards-empty-icon">🕯</div>
        <p class="cards-empty-text">
          Accedi per ritrovare le tue schede<br>
          o iniziare un nuovo viaggio verso l'Inferno.
        </p>
      </div>`;
    isRendering = false;
  }
});
