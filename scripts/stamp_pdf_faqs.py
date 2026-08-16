import fitz
import os

ERRATA_MISSIONS = ['SITES OF POWER', 'ESCORT THE WOUNDED']
FAQ_MISSIONS = [
    'TO THE DEATH!', 'RECONNOITRE', 'FOG OF WAR', 'ASSASSINATION',
    'CONTEST OF CHAMPIONS', 'RETRIEVAL', 'SEIZE THE PRIZES',
    'TREASURE HOARD', 'STORM THE CAMP', 'CONVERGENCE'
]
DOUBLES_FAQ_MISSIONS = ['TOTAL CONQUEST', 'CLASH OF CHAMPIONS', 'DUEL OF WITS']

def stamp_pdf(filepath, badge_text, badge_color, bg_color):
    doc = fitz.open(filepath)
    page = doc[0]
    
    # Top banner under header: y ~ 54-68
    badge_rect = fitz.Rect(page.rect.width * 0.28, 54, page.rect.width * 0.72, 66)
    
    # Draw badge background
    shape = page.new_shape()
    shape.draw_rect(badge_rect)
    shape.finish(color=badge_color, fill=bg_color, width=0.75)
    shape.commit()
    
    # Insert badge text
    page.insert_textbox(
        badge_rect,
        badge_text,
        fontsize=6.8,
        fontname="helv",
        color=badge_color,
        align=fitz.TEXT_ALIGN_CENTER
    )
    
    pdf_bytes = doc.tobytes(deflate=True)
    doc.close()
    with open(filepath, "wb") as f_out:
        f_out.write(pdf_bytes)

# Process 1v1
for m in ERRATA_MISSIONS:
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/{m}_{lang}.pdf"
        txt = "🔴 ERRATA OFICIAL APLICADA" if lang == 'ES' else "🔴 OFFICIAL ERRATA APPLIED"
        stamp_pdf(fp, txt, (0.75, 0.15, 0.15), (0.98, 0.92, 0.92))
        print(f"[ERRATA] Stamped {fp}")

for m in FAQ_MISSIONS:
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/{m}_{lang}.pdf"
        txt = "⚡ ACTUALIZADO SEGÚN FAQ OFICIAL" if lang == 'ES' else "⚡ UPDATED PER OFFICIAL FAQ"
        stamp_pdf(fp, txt, (0.65, 0.45, 0.10), (0.98, 0.95, 0.88))
        print(f"[FAQ] Stamped {fp}")

# Process 2v2
for m in DOUBLES_FAQ_MISSIONS:
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/2vs2/{m}_{lang}.pdf"
        txt = "⚡ ACTUALIZADO SEGÚN FAQ OFICIAL" if lang == 'ES' else "⚡ UPDATED PER OFFICIAL FAQ"
        stamp_pdf(fp, txt, (0.65, 0.45, 0.10), (0.98, 0.95, 0.88))
        print(f"[2v2 FAQ] Stamped {fp}")
