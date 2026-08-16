import fitz

for name in ["SITES OF POWER_ES.pdf", "SITES OF POWER_EN.pdf", "ESCORT THE WOUNDED_ES.pdf", "ESCORT THE WOUNDED_EN.pdf"]:
    doc = fitz.open(f"public/pdfs/{name}")
    print(f"=== {name} ===")
    print(doc[0].get_text("text").encode('ascii', 'replace').decode('ascii'))
