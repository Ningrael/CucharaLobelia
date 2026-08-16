import fitz

doc = fitz.open("rules_pdfs/MATCHED PLAY Misiones.pdf")

print("=== POOL SYSTEM PAGES 10-11 ===")
for p in [9, 10]:
    print(f"--- Page {p+1} ---")
    print(doc[p].get_text("text"))

print("\n=== ALL SCENARIO HEADERS IN MATCHED PLAY MISIONES ===")
for p in range(15, 40):
    text = doc[p].get_text("text")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    print(f"Page {p+1:2d}: {' | '.join(lines[:6])}")
