import fitz
import json
import re
import unicodedata

doc = fitz.open('rules_pdfs/Armys Libros.pdf')

profiles = []
for i in range(len(doc)):
    page = doc[i]
    text = page.get_text("text")
    # Search for POINT or POINTS (which signifies a unit profile header)
    matches = re.findall(r'([A-Z\s,\'\-–—\(\)]{3,50})\s*\.{2,}\s*(\d{1,3})\s*POINTS?', text, re.IGNORECASE)
    if matches:
        for name, pts in matches:
            clean_name = name.strip().replace('\n', ' ')
            if len(clean_name) > 2 and not clean_name.startswith('PAGE'):
                profiles.append((i+1, clean_name, pts))

print(f"Total profiles found in Armys Libros.pdf: {len(profiles)}")
for p_num, name, pts in profiles:
    print(f"  Page {p_num:3d}: {name} ({pts} pts)")
