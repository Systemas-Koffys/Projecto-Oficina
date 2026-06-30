import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCFhP4dl2eJDOcxo6jfeYhBDZL48vITiE",
  authDomain: "sistema-arboricultura-tarija.firebaseapp.com",
  projectId: "sistema-arboricultura-tarija",
  storageBucket: "sistema-arboricultura-tarija.firebasestorage.app",
  messagingSenderId: "577237867493",
  appId: "1:577237867493:web:62d13f968caff2c9f2ed0c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Uso: node check_firestore.js <email> <password>");
  process.exit(1);
}

try {
  console.log(`Iniciando sesión en Firebase con ${email}...`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log("✅ Sesión iniciada exitosamente!");

  console.log("Cargando personal activo...");
  const collRef = collection(db, 'personal');
  const querySnap = await getDocs(collRef);
  const list = [];
  querySnap.forEach(docSnap => {
    const p = docSnap.data();
    if (p.estado === 'Activo' && p.username && p.username.trim() !== '') {
      list.push({
        nombre: p.nombre,
        username: p.username || '',
        role: p.role,
        cargo: p.cargo,
        foto: p.foto || null
      });
    }
  });

  console.log("Escribiendo catálogo de login público 'usuarios_login'...");
  const docRef = doc(db, 'catalogos', 'usuarios_login');
  await setDoc(docRef, { items: list, lastUpdated: serverTimestamp() });
  console.log("✅ ¡Catálogo público usuarios_login creado con éxito!");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
