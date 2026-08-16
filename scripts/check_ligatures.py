import json
import unicodedata
import re

with open('src/data/rules_knowledge.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count ligatures and weird unicode characters
ligatures_found = 0
weird_chars = set()

for d in data:
    content = d['content']
    for ch in content:
        code = ord(ch)
        if 0xFB00 <= code <= 0xFB4F:
            ligatures_found += 1
            weird_chars.add((ch, hex(code), unicodedata.name(ch, 'UNKNOWN')))

print(f"Total ligatures found in database: {ligatures_found}")
for ch, hx, name in sorted(weird_chars):
    print(f"  Character: {ch!r} ({hx}) -> {name}")
