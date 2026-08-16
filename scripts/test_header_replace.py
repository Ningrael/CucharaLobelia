import fitz

doc = fitz.open("public/pdfs/ESCORT THE WOUNDED_ES.pdf")
page = doc[0]

# Find the span
found_span = None
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                if "Misión" in s["text"] or "Mission" in s["text"]:
                    found_span = s
                    print("FOUND:", s)

if found_span:
    bbox = fitz.Rect(found_span["bbox"])
    # Expand slightly to clean surrounding
    clean_rect = fitz.Rect(bbox.x0 - 20, bbox.y0 - 2, bbox.x1 + 20, bbox.y1 + 2)
    
    # Check background color around clean_rect
    pix = page.get_pixmap(clip=clean_rect)
    print("Pixmap size:", pix.width, pix.height)
