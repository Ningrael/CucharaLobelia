import fitz

doc = fitz.open("public/pdfs/ESCORT THE WOUNDED_ES.pdf")
page = doc[0]

# Inspect text blocks with rect coordinates and fonts
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                if "Misión" in s["text"] or "Mission" in s["text"] or "20" in s["text"] or "21" in s["text"] or "SCENARIO" in s["text"]:
                    print("SPAN:", s["text"], "BBOX:", s["bbox"], "FONT:", s["font"], "SIZE:", s["size"], "COLOR:", s["color"])
