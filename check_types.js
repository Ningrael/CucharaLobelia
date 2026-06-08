import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDR3Ga2DaasjurMB0cA0zVD6F29142PdH8",
  authDomain: "mesbg-liga.firebaseapp.com",
  projectId: "mesbg-liga",
  storageBucket: "mesbg-liga.firebasestorage.app",
  messagingSenderId: "996755863510",
  appId: "1:996755863510:web:7c18593b163b8d56419677"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const adminSnap = await getDoc(doc(db, "players", "FEVRIws9tdOo0g8EpNfNiQ4tiJq2")); // admin
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      console.log("admin isAdmin value:", data.isAdmin, "type:", typeof data.isAdmin);
    }
    const sosaSnap = await getDoc(doc(db, "players", "KG2sX0mwtXZTqMn6fPhWc5zaD4z2")); // sosamatias
    if (sosaSnap.exists()) {
      const data = sosaSnap.data();
      console.log("sosamatias isAdmin value:", data.isAdmin, "type:", typeof data.isAdmin);
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

check();
