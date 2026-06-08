import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteField } from "firebase/firestore";

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
    await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    console.log("Logged in!");

    console.log("Writing to brackets/winners...");
    await setDoc(doc(db, "brackets", "winners"), {
      leagues: {
        ["test_league_launch"]: deleteField()
      }
    }, { merge: true });
    console.log("brackets/winners write succeeded!");

    console.log("Writing to brackets/losers...");
    await setDoc(doc(db, "brackets", "losers"), {
      leagues: {
        ["test_league_launch"]: deleteField()
      }
    }, { merge: true });
    console.log("brackets/losers write succeeded!");

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
