import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";

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

async function runCleanup() {
  console.log("=== DB CLEANUP SCRIPT (AUTH AS ADMIN) ===");

  // 1. Authenticate as admin@cucharalobelia.com
  console.log("Signing in as admin@cucharalobelia.com...");
  await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
  console.log("Logged in as admin! Firestore permissions granted.\n");

  // 2. Fetch all players
  console.log("Fetching all players to clean createdLeagues & league enrollments...");
  const playersSnap = await getDocs(collection(db, "players"));
  
  let deletedPlayersCount = 0;
  let updatedPlayersCount = 0;
  
  for (const playerDoc of playersSnap.docs) {
    const data = playerDoc.data();
    const pEmail = data.email?.toLowerCase();
    const pUsername = data.username?.toLowerCase();
    
    // Matias account deletion check removed since user already recreated it.

    
    // For other players, clean up createdLeagues and leagues (enrollments)
    const updates = {};
    if (data.createdLeagues) {
      updates.createdLeagues = deleteField();
    }
    if (data.leagues) {
      updates.leagues = deleteField();
    }
    
    if (Object.keys(updates).length > 0) {
      console.log(`Cleaning league details from player ${data.name} (@${data.username})...`);
      await updateDoc(doc(db, "players", playerDoc.id), updates);
      updatedPlayersCount++;
    }
  }
  console.log(`Deleted ${deletedPlayersCount} player documents. Cleaned league references on ${updatedPlayersCount} players.`);

  // 3. Delete all matches
  console.log("\nDeleting all matches from matches collection...");
  const matchesSnap = await getDocs(collection(db, "matches"));
  let deletedMatchesCount = 0;
  for (const matchDoc of matchesSnap.docs) {
    await deleteDoc(doc(db, "matches", matchDoc.id));
    deletedMatchesCount++;
  }
  console.log(`Deleted ${deletedMatchesCount} match documents.`);

  console.log("\n=== CLEANUP COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

runCleanup().catch(err => {
  console.error("Fatal error during cleanup:", err);
  process.exit(1);
});
