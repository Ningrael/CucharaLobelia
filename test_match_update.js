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
    console.log("Logged in!");

    console.log("Attempting to update match (verify) as admin...");
    const matchId = "RnPS9b0OtpKgH0EtacqX"; // Match we created earlier where player1 was admin
    await updateDoc(doc(db, "matches", matchId), {
      verified: true
    });
    console.log("SUCCESS! Admin updated match!");

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
