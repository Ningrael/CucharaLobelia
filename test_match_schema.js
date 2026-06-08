import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    console.log("Logged in!");

    // Test: Write match with V1.0 fields
    console.log("Attempting to write match with V1.0 fields...");
    const matchRef = await addDoc(collection(db, "matches"), {
      player1: "FEVRIws9tdOo0g8EpNfNiQ4tiJq2",
      player2: "Jpm4dlk2pFgaanD9FiMHj4NgP9m1",
      verified: true,
      vpScored: 9,
      vpConceded: 6,
      killedLeader: true,
      lostLeader: true,
      result: "win",
      date: "2025-12-02",
      timestamp: serverTimestamp()
    });
    console.log("SUCCESS! Match ID:", matchRef.id);

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
