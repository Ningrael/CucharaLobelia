import fitz
import os
import re

pdf_dir = "public/pdfs"

print("=== CHECKING 1v1 PDFs in public/pdfs ===")
for f in sorted(os.listdir(pdf_dir)):
    if f.endswith(".pdf") and not f.startswith("sam"):
        full = os.path.join(pdf_dir, f)
        try:
            doc = fitz.open(full)
            text = doc[0].get_text("text")
            m = re.search(r'(SCENARIO|ESCENARIO)\s+(\d+)', text, re.IGNORECASE)
            num = m.group(0) if m else "NO SCENARIO NUMBER"
            # Get mission title
            title = f.replace(".pdf", "")
            print(f"{f:<32} -> {num}")
        except Exception as e:
            print(f"{f:<32} -> ERROR: {e}")

print("\n=== CHECKING 2v2 PDFs in public/pdfs/2vs2 ===")
doubles_dir = "public/pdfs/2vs2"
if os.path.exists(doubles_dir):
    for f in sorted(os.listdir(doubles_dir)):
        if f.endswith(".pdf"):
            full = os.path.join(doubles_dir, f)
            try:
                doc = fitz.open(full)
                text = doc[0].get_text("text")
                m = re.search(r'(SCENARIO|ESCENARIO)\s+(\d+)', text, re.IGNORECASE)
                num = m.group(0) if m else "NO SCENARIO NUMBER"
                print(f"{f:<32} -> {num}")
            except Exception as e:
                print(f"{f:<32} -> ERROR: {e}")
