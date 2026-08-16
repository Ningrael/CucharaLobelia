import fitz

for name in ["ESCORT THE WOUNDED.pdf", "DIVIDE & CONQUER.pdf", "DOMINATION.pdf", "SITES OF POWER.pdf"]:
    doc = fitz.open(f"public/pdfs/{name}")
    print(f"=== {name} ===")
    blocks = doc[0].get_text("dict")["blocks"]
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    if "SCENARIO" in s["text"] or "ESCENARIO" in s["text"]:
                        print("  SPAN:", s["text"], "BBOX:", s["bbox"], "FONT:", s["font"], "SIZE:", s["size"])
