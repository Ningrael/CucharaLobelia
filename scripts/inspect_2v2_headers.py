import fitz
import os

pdf_dir = "public/pdfs/2vs2"
for f in sorted(os.listdir(pdf_dir)):
    if f.endswith(".pdf"):
        full = os.path.join(pdf_dir, f)
        doc = fitz.open(full)
        text = doc[0].get_text("text").strip()
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        first_few = " | ".join(lines[:8]).encode('ascii', 'replace').decode('ascii')
        print(f"{f:<28}: {first_few}")
