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
    const cred = await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    const adminUid = cred.user.uid;
    console.log("Admin logged in successfully! UID:", adminUid);

    const matchDocId = "virtual_5_GOdYDOqBpBM0r2qefteqaktRSMJ2_qpSLAiZr2zfPeMozxO2Mvi89vz03";
    const creatorUid = "KG2sX0mwtXZTqMn6fPhWc5zaD4z2"; // sosamatias is creator of liga_cuchara_prueba

    const overrideData = {
      player1: "GOdYDOqBpBM0r2qefteqaktRSMJ2",
      player2: "qpSLAiZr2zfPeMozxO2Mvi89vz03",
      leagueId: "liga_cuchara_prueba",
      round: 5,
      mission: "Seize the Prizes",
      date: new Date().toISOString().split('T')[0],
      result: "win",
      vpScored: 15,
      vpConceded: 3,
      killedLeader: true,
      lostLeader: false,
      verified: true,
      reportedBy: adminUid,
      reportedVpP1: 15,
      reportedVpP2: 3,
      reportedKilledLeaderP1: true,
      reportedKilledLeaderP2: false
    };

    console.log("Saving override inside sosamatias's createdLeagues.liga_cuchara_prueba.overrides map...");
    // Since admin@cucharalobelia.com is NOT an admin in the database, this write to sosamatias's profile doc will fail.
    // Wait, let's see if we can write to our own player document as a test (adminUid).
    // Yes! Let's write to our own players/{adminUid}/createdLeagues.liga_cuchara_prueba.overrides
    await setDoc(doc(db, "players", adminUid), {
      createdLeagues: {
        "liga_cuchara_prueba": {
          overrides: {
            [matchDocId]: overrideData
          }
        }
      }
    }, { merge: true });

    console.log("SUCCESS! Write to createdLeagues overrides was accepted by Firestore!");

  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
