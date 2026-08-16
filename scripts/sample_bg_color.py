import fitz

doc = fitz.open("public/pdfs/ESCORT THE WOUNDED_ES.pdf")
page = doc[0]

pix = page.get_pixmap()
# Check RGB values around (297, 47) which is center top of page
sample_x = int(page.rect.width / 2)
sample_y = 47
print("Sample at", sample_x, sample_y, ":", pix.pixel(sample_x, sample_y))

# Check pixels at left and right of header
print("Sample at 200, 47:", pix.pixel(200, 47))
print("Sample at 400, 47:", pix.pixel(400, 47))
