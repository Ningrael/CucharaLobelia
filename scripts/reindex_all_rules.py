import fitz
import json
import os
import re

PDF_FILES = [
    {
        "file": "rules_pdfs/Reglamento.pdf",
        "book": "Reglamento Oficial MESBG",
        "category": "Reglamento Principal"
    },
    {
        "file": "rules_pdfs/Armys Libros.pdf",
        "book": "Armies of Middle-earth (Fallen Realms & Free Peoples)",
        "category": "Ejércitos"
    },
    {
        "file": "rules_pdfs/Armies of the Lord of the Rings.pdf",
        "book": "Armies of the Lord of the Rings",
        "category": "Ejércitos"
    },
    {
        "file": "rules_pdfs/Armys Hobbit.pdf",
        "book": "Armies of the Hobbit",
        "category": "Ejércitos"
    },
    {
        "file": "rules_pdfs/MATCHED PLAY Misiones.pdf",
        "book": "Matched Play Misiones Oficiales",
        "category": "Misiones"
    },
    {
        "file": "rules_pdfs/Legacy/Luz.pdf",
        "book": "Legacy - Bando de la Luz",
        "category": "Legacy"
    },
    {
        "file": "rules_pdfs/Legacy/Oscuridad.pdf",
        "book": "Legacy - Bando de la Oscuridad",
        "category": "Legacy"
    },
    {
        "file": "rules_pdfs/FAQ - Rules manual.pdf",
        "book": "FAQ - Manual de Reglas",
        "category": "FAQ & Erratas"
    },
    {
        "file": "rules_pdfs/FAQ - Armies of middle earth.pdf",
        "book": "FAQ - Armies of Middle Earth",
        "category": "FAQ & Erratas"
    },
    {
        "file": "rules_pdfs/FAQ - Armies of the lord of the ring.pdf",
        "book": "FAQ - Armies of the Lord of the Rings",
        "category": "FAQ & Erratas"
    },
    {
        "file": "rules_pdfs/FAQ - Armies of the hobbit.pdf",
        "book": "FAQ - Armies of the Hobbit",
        "category": "FAQ & Erratas"
    },
    {
        "file": "rules_pdfs/FAQ - Matched play misiones.pdf",
        "book": "FAQ - Matched Play Misiones",
        "category": "FAQ & Erratas"
    }
]

def clean_text(text):
    if not text:
        return ""
    # Normalize multiple whitespace, clean non-printable chars while preserving accents and punctuation
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Replace weird typography
    text = text.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    text = text.replace('–', '-').replace('—', '-')
    # Normalize spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalize multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_all():
    all_chunks = []
    stats = {}

    for pdf_info in PDF_FILES:
        filepath = pdf_info["file"]
        book_name = pdf_info["book"]
        category = pdf_info["category"]

        if not os.path.exists(filepath):
            print(f"WARNING: File not found: {filepath}")
            continue

        doc = fitz.open(filepath)
        total_pages = len(doc)
        stats[book_name] = {"total_pages": total_pages, "extracted_pages": 0, "chars": 0}

        for page_idx in range(total_pages):
            page = doc[page_idx]
            text = page.get_text("text")
            cleaned = clean_text(text)

            # Some pages in scanned/art PDFs might have low text or tables with layouts
            # Let's also extract text in blocks/tables if standard text is empty
            if len(cleaned) < 30:
                blocks = page.get_text("blocks")
                block_texts = [clean_text(b[4]) for b in blocks if len(b) > 4 and clean_text(b[4])]
                cleaned = "\n".join(block_texts)

            if len(cleaned) < 15:
                # Cover or pure art page with no rules
                continue

            stats[book_name]["extracted_pages"] += 1
            stats[book_name]["chars"] += len(cleaned)

            all_chunks.append({
                "book": book_name,
                "category": category,
                "page": page_idx + 1,
                "pdf_page": page_idx + 1,
                "total_pages": total_pages,
                "content": cleaned
            })

    output_path = "src/data/rules_knowledge.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    print("\n=== EXTRACTION SUMMARY ===")
    total_chunks = len(all_chunks)
    total_chars = sum(len(c["content"]) for c in all_chunks)
    for b, s in stats.items():
        print(f"{b}: {s['extracted_pages']}/{s['total_pages']} pages extracted ({s['chars']} chars)")
    print(f"\nTOTAL INDEXED SECTIONS: {total_chunks} pages | Total characters: {total_chars}")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    extract_all()
