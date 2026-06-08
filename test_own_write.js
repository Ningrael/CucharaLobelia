import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
    const adminUid = cred.user.uid;
    console.log("Logged in! Admin UID:", adminUid);

    console.log("Attempting to write to own createdLeagues field...");
    await setDoc(doc(db, "players", adminUid), {
      createdLeagues: {
        "test_league_own": {
          name: "Test League Own Write",
          status: "registration",
          registrationDeadline: "2025-06-08",
          creatorUid: adminUid,
          creatorName: "Admin",
          totalRounds: 0,
          missions: []
        }
      }
    }, { merge: true });
    console.log("SUCCESS! Write to own createdLeagues was allowed.");

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
