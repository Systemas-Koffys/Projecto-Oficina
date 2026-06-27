import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

console.log("Checking users in Firestore...");
const querySnap = await getDocs(collection(db, 'personal'));
querySnap.forEach(doc => {
  const data = doc.data();
  console.log(`${data.nombre} (${data.username}): email = ${data.email}, role = ${data.role}, estado = ${data.estado}, online = ${data.online}`);
});
process.exit(0);
