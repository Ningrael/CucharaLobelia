import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteField, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

    // Test 1: Write to matches
    console.log("Test 1: Writing a test match...");
    const matchRef = await addDoc(collection(db, "matches"), {
      leagueId: "test_league_launch",
      player1: "p1",
      player2: "p2",
      round: 1,
      timestamp: serverTimestamp()
    });
    console.log("Test 1 Success! Match ID:", matchRef.id);

    // Test 2: Write to brackets winners
    console.log("Test 2: Writing to brackets/winners...");
    await setDoc(doc(db, "brackets", "winners"), {
      leagues: {
        ["test_league_launch"]: deleteField()
      }
    }, { merge: true });
    console.log("Test 2 Success!");

    // Test 3: Write to brackets losers
    console.log("Test 3: Writing to brackets/losers...");
    await setDoc(doc(db, "brackets", "losers"), {
      leagues: {
        ["test_league_launch"]: deleteField()
      }
    }, { merge: true });
    console.log("Test 3 Success!");

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
