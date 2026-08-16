import fitz
import os

OFFICIAL_1V1 = {
    'DOMINATION': 1,
    'TO THE DEATH!': 2,
    'HOLD GROUND': 3,
    'DESTROY THE SUPPLIES': 4,
    'RECONNOITRE': 5,
    'FOG OF WAR': 6,
    'CAPTURE & CONTROL': 7,
    'BREAKTHROUGH': 8,
    'STAKE A CLAIM': 9,
    'LORDS OF BATTLE': 10,
    'ASSASSINATION': 11,
    'CONTEST OF CHAMPIONS': 12,
    'HEIRLOOM OF AGES PAST': 13,
    'SITES OF POWER': 14,
    'COMMAND THE BATTLEFIELD': 15,
    'RETRIEVAL': 16,
    'SEIZE THE PRIZES': 17,
    'TREASURE HOARD': 18,
    'STORM THE CAMP': 19,
    'DIVIDE & CONQUER': 20,
    'ESCORT THE WOUNDED': 21,
    'CLASH BY MOONLIGHT': 22,
    'LEAD FROM THE FRONT': 23,
    'CONVERGENCE': 24
}

count_updated = 0

for mission_name, official_num in OFFICIAL_1V1.items():
    for lang in ['ES', 'EN']:
        filepath = f"public/pdfs/{mission_name}_{lang}.pdf"
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} not found")
            continue

        doc = fitz.open(filepath)
        page = doc[0]
        
        # Look for the header span with Misión/Mission
        blocks = page.get_text("dict")["blocks"]
        target_span = None
        for b in blocks:
            if "lines" in b:
                for l in b["lines"]:
                    for s in l["spans"]:
                        if ("Misión" in s["text"] or "Mission" in s["text"] or "Misi" in s["text"]) and s["bbox"][1] < 70:
                            target_span = s
                            break

        if target_span:
            bbox = fitz.Rect(target_span["bbox"])
            # Redact the old header area cleanly
            erase_rect = fitz.Rect(page.rect.width * 0.25, bbox.y0 - 3, page.rect.width * 0.75, bbox.y1 + 3)
            page.add_redact_annot(erase_rect, fill=(253/255, 250/255, 246/255))
            page.apply_redactions()

            # Insert corrected official text centered
            new_text = f"Misión {official_num} / Mission {official_num}"
            rect_box = fitz.Rect(0, bbox.y0 - 1, page.rect.width, bbox.y1 + 5)
            page.insert_textbox(
                rect_box,
                new_text,
                fontsize=8.25,
                fontname="times-bold",
                color=(133/255, 106/255, 62/255),
                align=fitz.TEXT_ALIGN_CENTER
            )

            pdf_bytes = doc.tobytes(deflate=True)
            doc.close()
            with open(filepath, "wb") as f_out:
                f_out.write(pdf_bytes)
            print(f"[OK] Updated {filepath:<35} -> Misión {official_num} / Mission {official_num}")
            count_updated += 1
        else:
            print(f"[WARN] No header span found in {filepath}")

print(f"\nTotal PDFs updated: {count_updated}")
