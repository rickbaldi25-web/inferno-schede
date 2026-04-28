/**
 * INFERNO RPG - HOME PAGE SCRIPT
 * Gestisce Login, Libreria Schede, Effetti Visivi e Audio
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// --- 1. CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
  apiKey:            "AIzaSyAFtzNu6mzRI58umWN3-Y40o0UiI2YYPe8",
  authDomain:        "inferno-schede.firebaseapp.com",
  projectId:         "inferno-schede",
  storageBucket:     "inferno-schede.firebasestorage.app",
  messagingSenderId: "368915835108",
  appId:             "1:368915835108:web:43f8cbc47d5cb1f620a4f1"
};
// Registrazione Service Worker per installare la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('ServiceWorker registrato con successo: ', registration.scope);
    }).catch((err) => {
      console.log('Registrazione ServiceWorker fallita: ', err);
    });
  });
}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// --- 2. GESTIONE AUDIO E UI ---
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const audio = document.getElementById('bg-audio');
const musicBtn = document.getElementById('music-btn');
let isPlaying = false;

if (audio && musicBtn) {
  audio.volume = 0.3; 
  musicBtn.addEventListener('click', function() {
    if (isPlaying) {
      audio.pause();
      musicBtn.textContent = '🔇';
      musicBtn.classList.remove('playing');
    } else {
      audio.play().catch(error => console.log("Audio bloccato dal browser:", error));
      musicBtn.textContent = '🔊';
      musicBtn.classList.add('playing');
    }
    isPlaying = !isPlaying;
  });
}

// --- 3. EFFETTO SCINTILLE (Embers) ---
(function initEmbers(){
  const c = document.getElementById('embers');
  if(!c) return;
  const colors = ['#c49830','#A07820','#8B0000','#b01010','#d4a830'];
  for(let i = 0; i < 30; i++){
    const e = document.createElement('div');
    e.className = 'ember';
    const size = 1 + Math.random() * 3;
    e.style.cssText = [
      `--x:${Math.random()*100}%`,
      `--dur:${5 + Math.random()*9}s`,
      `--delay:${Math.random()*12}s`,
      `--drift:${(Math.random()-.5)*100}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${colors[Math.floor(Math.random()*colors.length)]}`,
      `box-shadow:0 0 ${size*2}px ${colors[0]}`
    ].join(';');
    c.appendChild(e);
  }
})();

// --- 4. FUNZIONI SCHEDA ---
window.creaNuovaScheda = function() {
  const nuovoId = 'sheet_' + Date.now();
  window.location.href = `/src/Inferno_Scheda_Generica?id=${nuovoId}`;
}; 

window.cancellaScheda = async function(idDocumento, event) {
  event.preventDefault(); 
  event.stopPropagation();
  if (confirm("Sei sicuro di voler abbandonare questo Smarrito nel baratro? La scheda verrà eliminata per sempre.")) {
    try {
      await deleteDoc(doc(db, "schede", idDocumento));
      alert("Scheda eliminata. Il suo viaggio si interrompe qui.");
      location.reload(); 
    } catch (err) {
      console.error("Errore durante l'eliminazione:", err);
      alert("L'Inferno trattiene questa anima: errore durante l'eliminazione.");
    }
  }
};

// --- 5. LOGICA DI AUTENTICAZIONE ---
if (btnLogin) {
  btnLogin.onclick = () => {
    if (!isPlaying && musicBtn) musicBtn.click(); // Fa partire l'audio
    signInWithPopup(auth, provider);
  };
}

if (btnLogout) {
  btnLogout.onclick = () => signOut(auth).then(() => location.reload());
}

let isRendering = false; 

onAuthStateChanged(auth, async (user) => {
  const container = document.querySelector('.cards-grid');
  if (!container || isRendering) return; 

  if (user) {
    isRendering = true; 
    if(btnLogin) btnLogin.style.display = 'none';
    if(btnLogout) btnLogout.style.display = 'inline-block';
    
    container.innerHTML = '';

    const btnNuovo = document.createElement('div');
    btnNuovo.className = 'scheda-card';
    btnNuovo.style.cssText = 'border-style: dashed; justify-content: center; align-items: center; cursor: pointer;';
    btnNuovo.innerHTML = '<h2 class="card-name" style="color: var(--g);">+ Nuovo</h2>';
    btnNuovo.onclick = window.creaNuovaScheda;
    container.appendChild(btnNuovo);

    if (user.email === "rickbaldi25@gmail.com") {
      const cardBart = document.createElement('a');
      cardBart.className = 'scheda-card';
cardBart.href = '/src/Bartolomeo_Scheda';
      cardBart.innerHTML = `
        <span class="card-num">Scheda 01</span>
        <h2 class="card-name">Bartolomeo</h2> 
        <div class="card-cta">Apri Viaggio</div>
      `;
      container.appendChild(cardBart);
    }

    try {
      const q = query(collection(db, "schede"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const renderedIds = new Set();

      querySnapshot.forEach((docSnap) => {
        if (docSnap.id.includes('bartolomeo') || renderedIds.has(docSnap.id)) return;
        
        renderedIds.add(docSnap.id);
        const info = docSnap.data();
        const idScheda = docSnap.id.substring(user.uid.length + 1);
        const link = `/src/Inferno_Scheda_Generica?id=${idScheda}`;
        const card = document.createElement('a');
        card.className = 'scheda-card';
        card.href = link;
        card.innerHTML = `
          <button class="del-card-btn" title="Elimina" onclick="window.cancellaScheda('${docSnap.id}', event)">✕</button>
          <span class="card-num">Smarrito</span>
          <h2 class="card-name"></h2>
          <div class="card-cta">Apri Viaggio</div>
        `;
        card.querySelector('.card-name').textContent = info.nome || 'Senza Nome';
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Errore caricamento schede:", err);
    } finally {
      isRendering = false; 
    }

  } else {
    if(btnLogin) btnLogin.style.display = 'inline-block';
    if(btnLogout) btnLogout.style.display = 'none';
    container.innerHTML = ''; 
    isRendering = false;
  }
});