import fitz

doc = fitz.open("rules_pdfs/MATCHED PLAY Misiones.pdf")

print("=== SCENARIOS LIST (1 to 24) ===")
for p in range(15, 40):
    text = doc[p].get_text("text")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first_few = " | ".join(lines[:8])
    print(f"Page {p+1:2d}: {first_few}")

print("\n=== DOUBLES SCENARIOS LIST (1 to 6) ===")
for p in range(40, 48):
    text = doc[p].get_text("text")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first_few = " | ".join(lines[:8])
    print(f"Page {p+1:2d}: {first_few}")
