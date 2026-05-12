// ============================================================
// FIREBASE — Inicialización (Compat SDK v10)
// Las claves apiKey/appId son públicas por diseño. La seguridad
// real vive en las reglas de Firestore (firestore.rules).
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBveJpFGdA0NW5cPmeQ8q55QSdrOOKPs8Y",
  authDomain: "masandera-app.firebaseapp.com",
  projectId: "masandera-app",
  storageBucket: "masandera-app.firebasestorage.app",
  messagingSenderId: "83759998254",
  appId: "1:83759998254:web:63c2fa3f10fcc2108446bf"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Cache offline: la app sigue andando sin internet y sincroniza al volver
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
