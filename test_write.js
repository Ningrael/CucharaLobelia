import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

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

async function runTest() {
  try {
    // 1. Sign in as admin
    console.log("Signing in as admin...");
    const credAdmin = await signInWithEmailAndPassword(auth, "admin@cucharalobelia.com", "123123");
    console.log("Admin logged in! UID:", credAdmin.user.uid);
    
    // 2. Create the admin's own profile document as status='pending' and isAdmin=false (since client can't set true)
    const adminProfile = {
      name: "Admin",
      email: "admin@cucharalobelia.com",
      points: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      vpScored: 0,
      vpConceded: 0,
      leadersKilled: 0,
      leadersLost: 0,
      status: "pending",
      isAdmin: false,
      username: "admin",
      phone: "+34 900 000 000",
      alignment: "luz",
      faction: "Otro / Alianza / Legión Legendaria"
    };
    
    console.log("Creating admin profile document...");
    await setDoc(doc(db, "players", credAdmin.user.uid), adminProfile);
    console.log("Admin profile document created!");
    
    // 3. Try to approve jugador1
    console.log("Attempting to approve jugador1 as admin...");
    const jugador1Uid = "Jpm4dlk2pFgaanD9FiMHj4NgP9m1"; // jugador1's UID from previous logs
    await updateDoc(doc(db, "players", jugador1Uid), { status: "approved" });
    console.log("Success! Admin approval update is allowed by security rules.");
    
  } catch (err) {
    console.error("Test failed:", err.message);
  }
  process.exit(0);
}

runTest();
