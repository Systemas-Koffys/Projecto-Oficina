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

try {
  const docRef = doc(db, 'solicitudes', 'podar_2126-26');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("📄 Document fields:", JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("❌ Document podar_2126-26 does not exist!");
  }
} catch (error) {
  console.error("❌ Error fetching document:", error.message);
}
process.exit(0);
