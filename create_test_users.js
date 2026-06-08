import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createUsers() {
  const users = [];
  
  // 12 players: 7 Light (Luz), 5 Dark (Oscuridad)
  for (let i = 1; i <= 12; i++) {
    const username = `jugador${i}`;
    const email = `${username}@cucharalobelia.com`;
    
    // Repeat number to satisfy Firebase's 6-character minimum password constraint
    let password = "";
    if (i < 10) {
      password = `${i}${i}${i}${i}${i}${i}`; // e.g. "111111"
    } else {
      password = `${i}${i}${i}`; // e.g. "101010", "111111", "121212"
    }
    
    const name = `Jugador ${i}`;
    const alignment = i <= 7 ? "luz" : "oscuridad";
    
    // Distribute factions
    const faction = alignment === "luz" 
      ? ["Rohan", "Minas Tirith", "Rivendell", "Lothlórien", "La Comarca (The Shire)"][(i - 1) % 5]
      : ["Mordor", "Isengard", "Moria", "Angmar", "Corsarios de Umbar"][(i - 8) % 5];
      
    users.push({ username, email, password, name, alignment, faction });
  }
  
  // Admin
  users.push({
    username: "admin",
    email: "admin@cucharalobelia.com",
    password: "123123", // satisfies 6-char minimum
    name: "Admin",
    alignment: "luz",
    faction: "Otro / Alianza / Legión Legendaria"
  });

  console.log(`Starting to create/update ${users.length} test users...`);
  
  for (const u of users) {
    try {
      console.log(`Creating user: ${u.username} (${u.email}) with password: ${u.password}...`);
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      
      const profile = {
        username: u.username,
        name: u.name,
        email: u.email,
        phone: `+34 600 000 0${u.username === 'admin' ? '00' : u.username.replace('jugador', '')}`,
        alignment: u.alignment,
        faction: u.faction,
        status: "pending",
        isAdmin: false,
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        vpScored: 0,
        vpConceded: 0,
        leadersKilled: 0,
        leadersLost: 0
      };
      
      await setDoc(doc(db, "players", cred.user.uid), profile);
      console.log(`Successfully created and saved profile for: ${u.username}`);
      
      await signOut(auth);
      await delay(400); // Small pause to prevent rate limiting
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`User ${u.username} already exists in Firebase Auth. Updating Firestore profile document...`);
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          const profile = {
            username: u.username,
            name: u.name,
            email: u.email,
            phone: `+34 600 000 0${u.username === 'admin' ? '00' : u.username.replace('jugador', '')}`,
            alignment: u.alignment,
            faction: u.faction,
            status: "pending",
            isAdmin: false,
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            vpScored: 0,
            vpConceded: 0,
            leadersKilled: 0,
            leadersLost: 0
          };
          await setDoc(doc(db, "players", cred.user.uid), profile);
          console.log(`Updated Firestore document for existing user: ${u.username}`);
          await signOut(auth);
          await delay(400);
        } catch (signInErr) {
          console.error(`Failed to sign in existing user ${u.username}:`, signInErr.message);
        }
      } else {
        console.error(`Failed to create user ${u.username}:`, err.message);
      }
    }
  }
  
  console.log("Creation of test users completed successfully!");
  process.exit(0);
}

createUsers();
