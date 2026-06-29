import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
// Firebase Storage no se usa - las imágenes se gestionan mediante Cloudinary CDN

// Configuración de Firebase alimentada por variables de entorno de Vite (.env)
// IMPORTANTE: Las credenciales NO deben estar hardcodeadas en el código fuente.
// Si alguna variable falta, el sistema mostrará un error controlado.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validación de seguridad: verificar que las variables de entorno estén definidas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ ERROR CRÍTICO: Las variables de entorno de Firebase no están configuradas. Revise el archivo .env');
}

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
