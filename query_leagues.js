import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR3Ga2DaasjurMB0cA0zVD6F29142PdH8",
  authDomain: "mesbg-liga.firebaseapp.com",
  projectId: "mesbg-liga",
  storageBucket: "mesbg-liga.firebasestorage.app",
  messagingSenderId: "996755863510",
  appId: "1:996755863510:web:7c18593b163b8d56419677"
};

async function run() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const playersSnap = await getDocs(collection(db, 'players'));
    console.log('--- LEAGUES AND CREATORS ---');
    playersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.createdLeagues) {
        console.log(`Player ID: ${doc.id} (${data.email || 'no email'})`);
        Object.keys(data.createdLeagues).forEach(leagueId => {
          const league = data.createdLeagues[leagueId];
          console.log(`  League ID: ${leagueId}`);
          console.log(`    Name: ${league.name}`);
          console.log(`    CreatorUid: ${league.creatorUid}`);
          console.log(`    Status: ${league.status}`);
          console.log(`    Rounds defined: ${league.rounds ? league.rounds.length : 0}`);
        });
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();
