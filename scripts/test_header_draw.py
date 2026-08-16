import fitz

doc = fitz.open("public/pdfs/ESCORT THE WOUNDED_ES.pdf")
page = doc[0]

blocks = page.get_text("dict")["blocks"]
target_span = None
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                if "Misión" in s["text"] or "Mission" in s["text"]:
                    target_span = s
                    break

if target_span:
    bbox = fitz.Rect(target_span["bbox"])
    # Erase area with exact parchment background
    erase_rect = fitz.Rect(page.rect.width * 0.3, bbox.y0 - 2, page.rect.width * 0.7, bbox.y1 + 3)
    page.add_redact_annot(erase_rect, fill=(253/255, 250/255, 246/255))
    page.apply_redactions()

    # Draw centered text
    new_text = "Misión 21 / Mission 21"
    rect_box = fitz.Rect(0, bbox.y0 - 1, page.rect.width, bbox.y1 + 5)
    page.insert_textbox(
        rect_box,
        new_text,
        fontsize=8.25,
        fontname="times-bold",
        color=(133/255, 106/255, 62/255),
        align=fitz.TEXT_ALIGN_CENTER
    )

pix = page.get_pixmap(clip=fitz.Rect(0, 0, page.rect.width, 100))
pix.save("scripts/test_escort_header.png")
print("Saved scripts/test_escort_header.png successfully!")
