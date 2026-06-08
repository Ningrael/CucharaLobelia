import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR3Ga2DaasjurMB0cA0zVD6F29142PdH8",
  authDomain: "mesbg-liga.firebaseapp.com",
  projectId: "mesbg-liga",
  storageBucket: "mesbg-liga.firebasestorage.app",
  messagingSenderId: "996755863510",
  appId: "1:996755863510:web:7c18593b163b8d56419677"
};

async function run() {
  console.log('Connecting to Firestore and fetching data...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const playersSnap = await getDocs(collection(db, 'players'));
    console.log('\n--- PLAYERS IN FIRESTORE ---');
    playersSnap.forEach((doc) => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('------------------------');
    });

    const matchesSnap = await getDocs(collection(db, 'matches'));
    console.log('\n--- MATCHES IN FIRESTORE ---');
    matchesSnap.forEach((doc) => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('------------------------');
    });
  } catch (err) {
    console.error('Error querying Firestore:', err);
  }
  process.exit(0);
}

run();
