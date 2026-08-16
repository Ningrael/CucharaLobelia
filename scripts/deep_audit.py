import json
import re

with open('src/data/rules_knowledge.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total pages in database: {len(data)}")

# 1. Check pages with short text
short_pages = [d for d in data if len(d['content']) < 120]
print(f"\nPages with < 120 chars: {len(short_pages)}")
for p in short_pages:
    print(f"  [{p['book']} p.{p['page']}] ({len(p['content'])} chars): {p['content'].replace(chr(10), ' ')}")

# 2. Check for missing factions or keywords
keywords = [
    'Aragorn', 'Boromir', 'Faramir', 'Gandalf', 'Legolas', 'Gimli', 'Theoden', 'Eomer', 'Eowyn',
    'Elrond', 'Gil-galad', 'Glorfindel', 'Galadriel', 'Celeborn', 'Thranduil', 'Dain', 'Thorin',
    'Sauron', 'Witch-king', 'Nazgul', 'Saruman', 'Lurtz', 'Ugluk', 'Gothmog', 'Suladan',
    'Barrow-wight', 'Gulavhar', 'Buhrdur', 'Shade', 'Cave Troll', 'Mordor Troll', 'Mumak',
    'Paralyse', 'Transfix', 'Compel', 'Fury', 'Black Dart', 'Sorcerous Blast', 'Tremor',
    'Heroic Strike', 'Heroic March', 'Heroic Combat', 'Heroic Move', 'Heroic Defence',
    'Break Point', 'Quartered', 'Cavalry Charge', 'Monstrous Charge', 'Brutal Power Attack'
]

print("\n=== KEYWORD COVERAGE CHECK ===")
for kw in keywords:
    matches = sum(1 for d in data if kw.lower() in d['content'].lower())
    print(f"  {kw:<24}: {matches} page matches")
