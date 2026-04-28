# Inferno RPG - Character Sheet Web App 🌑🔥

Benvenuto nella Web App ufficiale (non ufficiale) per la gestione delle schede personaggio di **Inferno - Dante's Guide to Hell**, l'ambientazione per la Quinta Edizione basata sulla Divina Commedia.

Questa applicazione è stata progettata per offrire un'esperienza fluida, tematica e sicura, ottimizzata sia per l'uso da desktop che come **Progressive Web App (PWA)** su dispositivi mobile.

## 🚀 Funzionalità Principali

- **Autenticazione Cloud:** Accesso sicuro tramite Google Firebase Authentication.
- **Salvataggio Multi-Scheda:** Possibilità di creare e gestire infiniti personaggi. Ogni scheda è identificata da un ID univoco nell'URL.
- **Sincronizzazione in Tempo Reale:** I dati vengono salvati automaticamente su Firebase Firestore, permettendoti di passare dal PC al telefono senza perdere progressi.
- **Ottimizzazione PWA:** Installabile sulla schermata home del tuo smartphone come un'app nativa (senza barre del browser).
- **Interfaccia Tematica:** Design ispirato all'estetica dell'Inferno dantesco con palette di colori dinamiche (Ember, Abyss, Ash, Venom, Light).
- **Libreria Personale:** Una Home Page intelligente che mostra solo le schede appartenenti all'utente loggato.
- **Accesso Speciale:** Sistema di filtraggio email per mostrare contenuti esclusivi (es. scheda di Bartolomeo per l'amministratore).

## 📂 Struttura del Progetto

- `index.html`: Il portale d'ingresso, gestisce il login e la visualizzazione della libreria dei personaggi.
- `Inferno_Scheda_Generica.html`: Il "motore" della scheda personaggio, adattabile a qualsiasi archetipo.
- `Bartolomeo_Scheda.html`: Versione specifica pre-compilata per il personaggio Bartolomeo (Lo Schiavo).
- `scheda.css`: File CSS unificato e ottimizzato per la responsività mobile e i "touch targets".
- `firebase-schede.js`: Tutta la logica di comunicazione con Firebase (Save, Load, Auth) centralizzata in un unico file.
- `manifest.json`: Configurazione PWA per l'installazione su dispositivi mobili.

## 🛠 Configurazione Tecnica

### Firebase Setup
Per far funzionare l'app, è necessario configurare un progetto su Firebase Console:
1. Abilitare **Authentication** con il provider **Google**.
2. Creare un **Firestore Database**.
3. Aggiungere il proprio dominio (es. `tuoutente.github.io`) nei **Domini Autorizzati** sotto le impostazioni di Authentication.

### Regole di Sicurezza Firestore
Inserire le seguenti regole per proteggere i dati degli utenti:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /schede/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
