import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase alimentada por variables de entorno de Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id"
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Obtener e instanciar servicios oficiales
const auth = getAuth(app);

// Inicializar Firestore habilitando PERSISTENCIA LOCAL MULTIPESTAÑA (IndexedDB)
// Esto maneja de forma transparente el almacenamiento en caché y la sincronización offline automática.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Firebase Storage para subir fotos de personal, logos, activos e inspecciones
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
