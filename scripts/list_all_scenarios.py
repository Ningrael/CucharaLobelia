import fitz
import json

doc = fitz.open("rules_pdfs/MATCHED PLAY Misiones.pdf")
print(f"Total pages in MATCHED PLAY Misiones.pdf: {len(doc)}")

scenarios = []
for page_num in range(len(doc)):
    page = doc[page_num]
    text = page.get_text("text")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # Check if page is a scenario page
    for line in lines[:5]:
        if "SCENARIO" in line.upper() or "SCENARIOS" in line.upper():
            scenarios.append((page_num + 1, line, lines[:4]))

print(f"Scenario markers found: {len(scenarios)}")
for p, marker, header in scenarios:
    print(f"Page {p:2d}: {marker} -> {' | '.join(header)}")
