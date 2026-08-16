import fitz
import os

pdf_dir = "public/pdfs"
for f in sorted(os.listdir(pdf_dir)):
    if f.endswith("_ES.pdf") or f.endswith("_EN.pdf"):
        full = os.path.join(pdf_dir, f)
        doc = fitz.open(full)
        text = doc[0].get_text("text").strip()
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        first_few = " | ".join(lines[:6]).encode('ascii', 'replace').decode('ascii')
        print(f"{f:<32}: {first_few}")
