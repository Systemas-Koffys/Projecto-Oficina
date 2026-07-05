import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const docRef = doc(db, 'solicitudes', 'podar_43-25');
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  console.log("Document fields:", docSnap.data());
} else {
  console.log("Document podar_43-25 does not exist.");
}
process.exit(0);
