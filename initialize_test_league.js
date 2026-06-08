import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

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

async function runInitialization() {
  const leagueId = "liga_cuchara_prueba";
  
  try {
    console.log("Signing in as admin to authenticate...");
    const credAdmin = await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    const adminUid = credAdmin.user.uid;
    console.log("Logged in! Admin UID:", adminUid);

    // 1. Initialize the league in config/league
    console.log("Initializing league in config/league...");
    const leagueData = {
      name: "liga cuchara de prueba",
      status: "registration",
      registrationDeadline: "2025-06-08",
      creatorUid: adminUid,
      creatorName: "Admin",
      totalRounds: 0,
      missions: []
    };

    try {
      await setDoc(doc(db, "config", "league"), {
        leaguesList: {
          [leagueId]: leagueData
        }
      }, { merge: true });
      console.log("League configuration saved successfully!");
    } catch (e) {
      console.warn("\n⚠️ WARNING: Could not write to config/league directly from CLI due to security rules.");
      console.warn("Please make sure to create the league named 'liga cuchara de prueba' manually in the UI using the 'Crear Liga' button.\n");
    }

    // 2. Fetch all players and enroll them
    console.log("Fetching players list...");
    const playersSnap = await getDocs(collection(db, "players"));
    
    let updatedCount = 0;
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data();
      const username = data.username?.toLowerCase();
      
      if (!username) continue;

      if (username === "admin") {
        console.log(`Enrolling admin as approved (non-participant)...`);
        await updateDoc(doc(db, "players", playerDoc.id), {
          [`leagues.${leagueId}`]: {
            status: "approved",
            alignment: data.alignment || "luz",
            faction: data.faction || "Ninguna",
            participates: false
          }
        });
        updatedCount++;
      } else if (username.startsWith("jugador")) {
        console.log(`Enrolling player: ${data.username} as pending...`);
        await updateDoc(doc(db, "players", playerDoc.id), {
          [`leagues.${leagueId}`]: {
            status: "pending",
            alignment: data.alignment || "luz",
            faction: data.faction || "Ninguna",
            participates: true
          }
        });
        updatedCount++;
      }
    }

    console.log(`Successfully enrolled ${updatedCount} users into the league: ${leagueId}!`);
    console.log("Done!");
  } catch (err) {
    console.error("Failed to initialize test league:", err.message);
  }
  process.exit(0);
}

runInitialization();
