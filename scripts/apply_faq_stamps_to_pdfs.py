import fitz
import os

ERRATA_MISSIONS = {
    'SITES OF POWER': {
        'es': '[ ERRATA OFICIAL APLICADA - Strange Aura: 5-6 ]',
        'en': '[ OFFICIAL ERRATA APPLIED - Strange Aura: 5-6 ]'
    },
    'ESCORT THE WOUNDED': {
        'es': '[ ERRATA OFICIAL APLICADA - Puntuacion y Rescate ]',
        'en': '[ OFFICIAL ERRATA APPLIED - Scoring & Rescue ]'
    }
}

FAQ_MISSIONS = {
    'TO THE DEATH!': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Monturas Heroe y Desempate ]',
        'en': '[ UPDATED PER FAQ - Hero Mounts & Tie-Break ]'
    },
    'RECONNOITRE': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Dominant X y Heroes ]',
        'en': '[ UPDATED PER FAQ - Dominant X & Heroes ]'
    },
    'FOG OF WAR': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Blanco de Heroe ]',
        'en': '[ UPDATED PER FAQ - Hero Target Rules ]'
    },
    'ASSASSINATION': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Blanco de Asesinato ]',
        'en': '[ UPDATED PER FAQ - Assassination Target ]'
    },
    'CONTEST OF CHAMPIONS': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Despliegue de Campeon ]',
        'en': '[ UPDATED PER FAQ - Champion Deployment ]'
    },
    'RETRIEVAL': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Solapamiento de Zonas ]',
        'en': '[ UPDATED PER FAQ - Zone Overlap Scoring ]'
    },
    'SEIZE THE PRIZES': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Solapamiento de Mitades ]',
        'en': '[ UPDATED PER FAQ - Board Half Overlap ]'
    },
    'TREASURE HOARD': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Medicion desde Portador ]',
        'en': '[ UPDATED PER FAQ - Measurement from Bearer ]'
    },
    'STORM THE CAMP': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Wholly Within en Campamento ]',
        'en': '[ UPDATED PER FAQ - Wholly Within Camp ]'
    },
    'CONVERGENCE': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Medicion de Reliquias ]',
        'en': '[ UPDATED PER FAQ - Heirloom Measurement ]'
    },
    'TOTAL CONQUEST': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Control Multiple ]',
        'en': '[ UPDATED PER FAQ - Multiple Control ]'
    },
    'CLASH OF CHAMPIONS': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Despliegue de Campeones ]',
        'en': '[ UPDATED PER FAQ - Champions Deployment ]'
    },
    'DUEL OF WITS': {
        'es': '[ ACTUALIZADO SEGUN FAQ - Blanco Secreto ]',
        'en': '[ UPDATED PER FAQ - Secret Target Rules ]'
    }
}

def stamp_badge(filepath, text, is_errata):
    doc = fitz.open(filepath)
    page = doc[0]
    
    # Coordinates in header under the mission number (y=56 to y=68)
    badge_width = min(320.0, len(text) * 4.6 + 24)
    center_x = page.rect.width / 2
    badge_rect = fitz.Rect(center_x - badge_width/2, 55.5, center_x + badge_width/2, 67.5)
    
    # Border & background colors
    if is_errata:
        border_color = (0.78, 0.18, 0.18) # Deep red
        bg_color = (0.98, 0.92, 0.92)     # Soft red
        text_color = (0.65, 0.10, 0.10)   # Dark red
    else:
        border_color = (0.75, 0.52, 0.12) # Gold / Bronze
        bg_color = (0.98, 0.95, 0.88)     # Soft gold parchment
        text_color = (0.50, 0.33, 0.05)   # Dark amber bronze
    
    # Draw rect badge
    shape = page.new_shape()
    shape.draw_rect(badge_rect)
    shape.finish(color=border_color, fill=bg_color, width=0.8)
    shape.commit()
    
    # Insert badge text
    page.insert_textbox(
        fitz.Rect(badge_rect.x0, badge_rect.y0 - 0.5, badge_rect.x1, badge_rect.y1 + 1),
        text,
        fontsize=6.5,
        fontname="times-bold",
        color=text_color,
        align=fitz.TEXT_ALIGN_CENTER
    )
    
    pdf_bytes = doc.tobytes(deflate=True)
    doc.close()
    with open(filepath, "wb") as f_out:
        f_out.write(pdf_bytes)

# 1. Apply Erratas
for mission, data in ERRATA_MISSIONS.items():
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/{mission}_{lang}.pdf"
        if os.path.exists(fp):
            txt = data[lang.lower()]
            stamp_badge(fp, txt, is_errata=True)
            print(f"Stamped: {mission} ({lang})")

# 2. Apply 1v1 FAQs
for mission, data in FAQ_MISSIONS.items():
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/{mission}_{lang}.pdf"
        if os.path.exists(fp):
            txt = data[lang.lower()]
            stamp_badge(fp, txt, is_errata=False)
            print(f"Stamped: {mission} ({lang})")

# 3. Apply 2v2 FAQs
for mission, data in FAQ_MISSIONS.items():
    for lang in ['ES', 'EN']:
        fp = f"public/pdfs/2vs2/{mission}_{lang}.pdf"
        if os.path.exists(fp):
            txt = data[lang.lower()]
            stamp_badge(fp, txt, is_errata=False)
            print(f"Stamped: 2v2 {mission} ({lang})")
