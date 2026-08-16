import fitz

doc = fitz.open("rules_pdfs/FAQ - Matched play misiones.pdf")
print(f"Total pages in FAQ - Matched play misiones.pdf: {len(doc)}")

for i in range(len(doc)):
    print(f"\n==================== PAGE {i+1} ====================")
    print(doc[i].get_text("text"))
