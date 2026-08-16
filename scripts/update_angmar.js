import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/rules_knowledge.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const angmarProfiles = [
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 118,
    pdf_page: 118,
    total_pages: 200,
    content: 'BARROW-WIGHT ....................................................................50 POINTS Base size 25MM Race SPIRIT Faction ANGMAR Unit Type HERO, INFANTRY Mv Fv Sv S D A W C I 6" 3 5+ 3 7 1 2 4+ 6+ Might: 0, Will: 5, Fate: 0 WARGEAR Heavy armour and hand weapon. SPECIAL RULES Blades of the Dead, Spectral Walk, Terror MAGICAL POWERS Paralyse (Range: 6", Casting Value: 3+) Barrow-wights are the spirits of the long dead rulers of Men, brought into being by the dark sorceries of the Witch-king of Angmar and bound to his indomitable will. Even after the dread kingdom of Angmar fell into ruin, the Barrow-wights continued to linger. Those that strayed into their domain were to meet an untimely death, for the very touch of these fell spirits is enough to paralyse their victims, leaving the Barrow-wights free to sacrifice them at their leisure.'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 116,
    pdf_page: 116,
    total_pages: 200,
    content: 'GÛLAVHAR, THE TERROR OF ARNOR ........................................200 POINTS Base size 60MM Race MONSTER Faction ANGMAR Unit Type HERO, MONSTER, INFANTRY, UNIQUE Mv Fv Sv S D A W C I 12" 7 4+ 8 7 4 4 6+ 5+ Might: 3, Will: 3, Fate: 0 WARGEAR Claws and fangs. HEROIC ACTIONS Heroic Strike, Heroic Strength, Heroic Defence SPECIAL RULES Fly (12"), Terror, Monstrous Charge, Swift Movement Strength of the Terror PASSIVE – Gûlavhar is a creature of dark power whose strength wanes as he suffers wounds. Gûlavhar’s Fight Value and Attacks are always equal to his current number of remaining Wounds. Feeding on Flesh PASSIVE – At the end of any Combat in which Gûlavhar slays one or more enemy models, he regains 1 Wound previously lost (up to his starting maximum of 4).'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 117,
    pdf_page: 117,
    total_pages: 200,
    content: 'BUHRDÛR, TROLL CHIEFTAIN OF ANGMAR .................................110 POINTS Base size 60MM Race TROLL Faction ANGMAR Unit Type HERO, MONSTER, INFANTRY, UNIQUE Mv Fv Sv S D A W C I 6" 6 4+ 6 7 3 3 5+ 6+ Might: 3, Will: 1, Fate: 1 WARGEAR Hand weapon (Spiked Club). HEROIC ACTIONS Heroic Strike, Heroic Strength SPECIAL RULES Terror, Throw Stones (range 12", Strength 8), Monstrous Charge, Large Target'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 119,
    pdf_page: 119,
    total_pages: 200,
    content: 'SHADE ............................................................................100 POINTS Base size 25MM Race SPIRIT Faction ANGMAR Unit Type HERO, INFANTRY Mv Fv Sv S D A W C I 6" 1 6+ 3 8 1 3 4+ 8+ Might: 0, Will: 0, Fate: 0 SPECIAL RULES Blades of the Dead, Spectral Walk, Terror Chill Aura PASSIVE – The aura of dread surrounding a Shade chills the blood of its enemies. Any enemy model within 6" of one or more friendly Shade models suffers a -1 penalty to their Duel Rolls and a -1 penalty to their Wound Rolls.'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 120,
    pdf_page: 120,
    total_pages: 200,
    content: 'WEREWOLF OF ANGMAR .............................................................20 POINTS Base size 40MM Race BEAST Faction ANGMAR Unit Type WARRIOR, INFANTRY, BEAST Mv Fv Sv S D A W C I 8" 4 5+ 5 5 2 2 3+ 5+ WARGEAR Claws and teeth (hand weapon). SPECIAL RULES Terror, Swift Movement, Woodland Creature'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 121,
    pdf_page: 121,
    total_pages: 200,
    content: 'ANGMAR ORC CAPTAIN .............................................................45 POINTS Base size 25MM Race ORC Faction ANGMAR Unit Type HERO, INFANTRY Mv Fv Sv S D A W C I 6" 4 5+ 4 5 2 2 4+ 6+ Might: 2, Will: 1, Fate: 1 WARGEAR Armour and hand weapon. OPTIONS Shield (5 pts), Orc Bow (5 pts), Two-handed weapon (5 pts), Warg (10 pts). HEROIC ACTIONS Heroic March, Heroic Strike'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 122,
    pdf_page: 122,
    total_pages: 200,
    content: 'ANGMAR ORC SHAMAN .............................................................50 POINTS Base size 25MM Race ORC Faction ANGMAR Unit Type HERO, INFANTRY Mv Fv Sv S D A W C I 6" 3 5+ 3 4 1 2 4+ 6+ Might: 1, Will: 3, Fate: 1 WARGEAR Armour and dagger (hand weapon). OPTIONS Spear (5 pts), Warg (10 pts). HEROIC ACTIONS Heroic Channelling MAGICAL POWERS Fury (Angmar Orc) Range: Self, Casting: 3+, Duration: Exhaustion; Wither Range: 12", Casting: 4+, Duration: Temporary.'
  },
  {
    book: 'Armies of Middle-earth - Fallen Realms',
    category: 'Ejércitos',
    page: 123,
    pdf_page: 123,
    total_pages: 200,
    content: 'ANGMAR ORC WARRIOR .............................................................6 POINTS Base size 25MM Race ORC Faction ANGMAR Unit Type WARRIOR, INFANTRY Mv Fv Sv S D A W C I 6" 3 5+ 3 4 1 1 5+ 6+ WARGEAR Armour and hand weapon. OPTIONS Shield (1 pt), Spear (1 pt), Orc Bow (1 pt), Two-handed weapon (1 pt), Banner (25 pts).'
  }
];

let nextId = Object.keys(data).length;
for (const p of angmarProfiles) {
  data[nextId.toString()] = p;
  nextId++;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated rules_knowledge.json! Total items:', Object.keys(data).length);
