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

const roundsArrayToMap = (rounds) => {
  if (!rounds) return {};
  if (!Array.isArray(rounds)) return rounds;
  const map = {};
  rounds.forEach((roundMatches, rIdx) => {
    map[rIdx] = roundMatches;
  });
  return map;
};

async function run() {
  try {
    console.log("Signing in as admin...");
    const cred = await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    const adminUid = cred.user.uid;
    console.log("Logged in! UID:", adminUid);

    const rounds = [
      [
        { player1: "p1", player2: "p2", mission: "Mision 1", round: 1 },
        { player1: "p3", player2: "p4", mission: "Mision 1", round: 1 }
      ],
      [
        { player1: "p1", player2: "p3", mission: "Mision 2", round: 2 },
        { player1: "p2", player2: "p4", mission: "Mision 2", round: 2 }
      ]
    ];

    console.log("Saving rounds structure as Map...");
    await setDoc(doc(db, "players", adminUid), {
      createdLeagues: {
        "test_league_map_fix": {
          name: "Test League Map Fix",
          status: "active",
          registrationDeadline: "2025-06-08",
          creatorUid: adminUid,
          creatorName: "Admin",
          totalRounds: 2,
          missions: ["Mision 1", "Mision 2"],
          rounds: roundsArrayToMap(rounds),
          winnersBracket: deleteField(),
          losersBracket: deleteField()
        }
      }
    }, { merge: true });

    console.log("SUCCESS! The rounds Map write was accepted by Firestore!");
  } catch (err) {
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

run();
