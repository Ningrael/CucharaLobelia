import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function testRead(label) {
  try {
    const snap = await getDoc(doc(db, "config", "league"));
    if (snap.exists()) {
      console.log(`[${label}] Success! Data:`, JSON.stringify(snap.data()).substring(0, 150));
    } else {
      console.log(`[${label}] Success! Document does not exist.`);
    }
  } catch (err) {
    console.log(`[${label}] Failed:`, err.message);
  }
}

async function run() {
  // Test 1: Unauthenticated
  await signOut(auth);
  await testRead("Unauthenticated");

  // Test 2: admin@cucharalobelia.com
  try {
    await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    await testRead("admin@cucharalobelia.com");
  } catch (err) {
    console.log("admin login failed:", err.message);
  }

  // Test 3: jugador1@cucharalobelia.com
  try {
    await signInWithEmailAndPassword(auth, "jugador1@cucharalobelia.com", "111111");
    await testRead("jugador1@cucharalobelia.com");
  } catch (err) {
    console.log("jugador1 login failed:", err.message);
  }

  process.exit(0);
}

run();
