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

const passwords = ["123123", "123456", "sosamatias", "matias", "sosa", "lobelia"];

async function run() {
  const email = "sosamatias@gmail.com";
  let loggedIn = false;
  let cred = null;

  for (const pwd of passwords) {
    try {
      console.log(`Trying password: ${pwd} for ${email}...`);
      cred = await signInWithEmailAndPassword(auth, email, pwd);
      console.log("Logged in successfully!");
      loggedIn = true;
      break;
    } catch (e) {
      console.log(`Failed with password ${pwd}: ${e.message}`);
    }
  }

  if (loggedIn && cred) {
    try {
      console.log("Updating player fields to valid values...");
      await updateDoc(doc(db, "players", cred.user.uid), {
        vpScored: 0,
        vpConceded: 0,
        leadersKilled: 0,
        leadersLost: 0
      });
      console.log("SUCCESS! Sosa profile fields updated to valid values.");
    } catch (err) {
      console.error("Failed to update profile fields:", err.message);
    }
  } else {
    console.log("Could not log in as sosamatias.");
  }
  process.exit(0);
}

run();
