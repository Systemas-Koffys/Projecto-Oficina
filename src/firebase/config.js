import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
// Firebase Storage no se usa - las imágenes se gestionan mediante Cloudinary CDN

// Configuración de Firebase alimentada por variables de entorno de Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDCFhP4dl2eJDOcxo6jfeYhBDZL48vITiE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sistema-arboricultura-tarija.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sistema-arboricultura-tarija",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sistema-arboricultura-tarija.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "577237867493",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:577237867493:web:62d13f968caff2c9f2ed0c"
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Servicios de Firebase
const auth = getAuth(app);

// Inicializar Firestore habilitando PERSISTENCIA LOCAL MULTIPESTAÑA (IndexedDB)
// Esto maneja de forma transparente el almacenamiento en caché y la sincronización offline automática.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { app, auth, db, firebaseConfig };
