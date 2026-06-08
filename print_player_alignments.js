import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDR3Ga2DaasjurMB0cA0zVD6F29142PdH8",
  authDomain: "mesbg-liga.firebaseapp.com",
  projectId: "mesbg-liga",
  storageBucket: "mesbg-liga.firebasestorage.app",
  messagingSenderId: "996755863510",
  appId: "1:996755863510:web:7c18593b163b8d56419677"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    const snap = await getDocs(collection(db, "players"));
    snap.forEach(doc => {
      const data = doc.data();
      const leagueInfo = data.leagues && data.leagues.liga_cuchara_prueba;
      console.log(`Username: ${data.username} => Global Align: ${data.alignment}, League Align: ${leagueInfo ? leagueInfo.alignment : 'not enrolled'}`);
    });
  } catch (err) {
    console.error("Failed:", err.message);
  }
  process.exit(0);
}

run();
