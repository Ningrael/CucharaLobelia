import fitz

doc = fitz.open('rules_pdfs/MATCHED PLAY Misiones.pdf')
print(f"Total pages in MATCHED PLAY Misiones.pdf: {len(doc)}")

sections = []
for i in range(len(doc)):
    page = doc[i]
    text = page.get_text("text")
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        sections.append((i+1, lines[0], len(text)))

print(f"Total pages with text: {len(sections)}")
for p_num, title, chars in sections[:25]:
    print(f"  Page {p_num:2d} ({chars:5d} chars): {title[:60]}")
