import fitz

doc = fitz.open("public/pdfs/SITES OF POWER_ES.pdf")
page = doc[0]

blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                    txt = s["text"].encode('ascii', 'replace').decode('ascii')
                    print("SPAN:", txt, "BBOX:", s["bbox"], "SIZE:", s["size"])
