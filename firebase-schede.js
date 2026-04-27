import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAFtzNu6mzRI58umWN3-Y40o0UiI2YYPe8",
  authDomain: "inferno-schede.firebaseapp.com",
  projectId: "inferno-schede",
  storageBucket: "inferno-schede.firebasestorage.app",
  messagingSenderId: "368915835108",
  appId: "1:368915835108:web:43f8cbc47d5cb1f620a4f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper per i messaggi nella toolbar
function setStatus(txt, color){
  var m = document.getElementById('sv-msg');
  if(!m) return;
  m.textContent = txt;
  m.style.color = color || 'var(--g)';
  m.classList.add('show');
}

function hideStatus(){
  setTimeout(function(){ 
    var m = document.getElementById('sv-msg');
    if(m) m.classList.remove('show'); 
  }, 2500);
}

// Legge l'ID della scheda dall'URL o usa un default
function getDocId(uid) {
  if (window.SHEET_ID === 'bartolomeo') {
    return uid + '_bartolomeo';
  }
  
  // Cerca un parametro "?id=" nell'indirizzo web
  const urlParams = new URLSearchParams(window.location.search);
  const sheetId = urlParams.get('id');
  
  if (sheetId) {
    return uid + '_' + sheetId; // Es: uid_123456789
  }
  
  return uid + '_gen_default';
}

// Funzione globale di salvataggio
async function fbSave(data){
  try {
    const uid = auth.currentUser?.uid;
    if(!uid){ setStatus('⚠ Non connesso', '#e06060'); hideStatus(); return; }
    
    await setDoc(doc(db, 'schede', getDocId(uid)), {
      uid: uid, // AGGIUNTA FONDAMENTALE: ci serve per trovare le schede dell'utente dopo!
      data: JSON.stringify(data),
      nome: data.nome || 'Smarrito',
      updatedAt: new Date().toISOString()
    });
    setStatus('☁ Salvato ✓', 'var(--g)');
    hideStatus();
  } catch(err){
    console.error(err);
    setStatus('⚠ Errore salvataggio', '#e06060');
    hideStatus();
  }
}

// Agganciamo la funzione di salvataggio all'oggetto window così i bottoni HTML possono vederla
window._fbSaveGen = fbSave;
window._fbSave = fbSave; 

// Funzione globale di caricamento
async function fbLoad(uid){
  try {
    const id = getDocId(uid);
    const snap = await getDoc(doc(db, 'schede', id));
    
    if(snap.exists()){
      const parsed = JSON.parse(snap.data().data);
      const fbTime = snap.data().updatedAt || '';
      
      // Controllo se il cloud ha dati più recenti del localStorage
      let localRaw = null;
      if (window.SHEET_ID === 'bartolomeo') {
          localRaw = localStorage.getItem('inf_bart_v4');
      } else {
          const lastKey = localStorage.getItem('inferno_gen_last');
          localRaw = lastKey ? localStorage.getItem(lastKey) : null;
      }
      
      const local = localRaw ? JSON.parse(localRaw) : null;
      const useCloud = !local || fbTime > (local._savedAt || '');
      
      if(useCloud){
        window.D = parsed;
        if(window.applyAll) window.applyAll();
        setStatus('☁ Dati Cloud Caricati', 'var(--g)');
        hideStatus();
      }
    }
  } catch(err){
    console.error('fbLoad error:', err);
  }
}

// Rilevamento automatico dell'accesso (gestito dalla index)
onAuthStateChanged(auth, function(user){
  var brand = document.querySelector('.toolbar-brand');
  if(user){
    if(brand) brand.title = 'Account: ' + user.email;
    fbLoad(user.uid);
  } else {
    if(brand) brand.title = 'Offline';
  }
});

// Salvataggio automatico ogni 60 secondi
setInterval(function(){
  if(auth.currentUser && window.collect && window.D){
    window.collect();
    fbSave(window.D);
  }
}, 60000);
