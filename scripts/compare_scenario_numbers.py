import fitz
import os
import re

OFFICIAL_1V1 = {
    'DOMINATION': 1,
    'TO THE DEATH!': 2,
    'HOLD GROUND': 3,
    'DESTROY THE SUPPLIES': 4,
    'RECONNOITRE': 5,
    'FOG OF WAR': 6,
    'CAPTURE & CONTROL': 7,
    'BREAKTHROUGH': 8,
    'STAKE A CLAIM': 9,
    'LORDS OF BATTLE': 10,
    'ASSASSINATION': 11,
    'CONTEST OF CHAMPIONS': 12,
    'HEIRLOOM OF AGES PAST': 13,
    'SITES OF POWER': 14,
    'COMMAND THE BATTLEFIELD': 15,
    'RETRIEVAL': 16,
    'SEIZE THE PRIZES': 17,
    'TREASURE HOARD': 18,
    'STORM THE CAMP': 19,
    'DIVIDE & CONQUER': 20,
    'ESCORT THE WOUNDED': 21,
    'CLASH BY MOONLIGHT': 22,
    'LEAD FROM THE FRONT': 23,
    'CONVERGENCE': 24
}

OFFICIAL_2V2 = {
    'NO ESCAPE': 1,
    'TOTAL CONQUEST': 2,
    'TAKE & HOLD': 3,
    'CLASH OF CHAMPIONS': 4,
    'CORNERED': 5,
    'DUEL OF WITS': 6
}

print("=== 1v1 CUSTOM PDFs ===")
for mission, correct_num in OFFICIAL_1V1.items():
    for lang in ['ES', 'EN']:
        filename = f"public/pdfs/{mission}_{lang}.pdf"
        if os.path.exists(filename):
            doc = fitz.open(filename)
            text = doc[0].get_text("text")
            m = re.search(r'Misi[oó]n\s+(\d+)\s*/\s*Mission\s+(\d+)', text, re.IGNORECASE)
            current_num = m.group(1) if m else "NONE"
            print(f"{mission:<24} ({lang}) -> Current: Misión {current_num:<4} | Official Target: Misión {correct_num}")

print("\n=== 2v2 CUSTOM PDFs ===")
for mission, correct_num in OFFICIAL_2V2.items():
    for lang in ['ES', 'EN']:
        filename = f"public/pdfs/2vs2/{mission}_{lang}.pdf"
        if os.path.exists(filename):
            doc = fitz.open(filename)
            text = doc[0].get_text("text")
            m = re.search(r'Misi[oó]n\s+(\d+)\s*/\s*Mission\s+(\d+)', text, re.IGNORECASE)
            current_num = m.group(1) if m else "NONE"
            print(f"2v2: {mission:<20} ({lang}) -> Current: Misión {current_num:<4} | Official Target: Misión {correct_num}")
