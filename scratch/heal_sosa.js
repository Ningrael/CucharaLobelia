import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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
    console.log("Signing in as admin...");
    const cred = await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    console.log("Admin logged in successfully! UID:", cred.user.uid);

    const sosaUid = "KG2sX0mwtXZTqMn6fPhWc5zaD4z2";
    console.log("Updating sosamatias's profile stats...");
    await updateDoc(doc(db, "players", sosaUid), {
      vpScored: 0,
      vpConceded: 0,
      leadersKilled: 0,
      leadersLost: 0
    });
    console.log("SUCCESS! Sosa stats healed successfully.");
  } catch (err) {
    console.error("Heal failed:", err.message);
  }
  process.exit(0);
}

run();
