import fitz
import json

print("=== FAQ - MATCHED PLAY MISIONES ===")
doc = fitz.open("rules_pdfs/FAQ - Matched play misiones.pdf")
for i, page in enumerate(doc):
    print(f"--- Page {i+1} ---")
    print(page.get_text("text"))

print("\n=== FAQ - RULES MANUAL (Matched play entries) ===")
doc_rules = fitz.open("rules_pdfs/FAQ - Rules manual.pdf")
for i, page in enumerate(doc_rules):
    t = page.get_text("text")
    if "scenario" in t.lower() or "matched play" in t.lower() or "objective" in t.lower() or "deployment" in t.lower():
        print(f"--- Rules FAQ Page {i+1} ---")
        print(t)
