import json

with open('src/data/rules_knowledge.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item['book'] == 'Armies of Middle-earth (Fallen Realms & Free Peoples)' and item['page'] in [125, 126, 130, 131, 132, 133]:
        print(f"=== {item['book']} Page {item['page']} ===")
        print(item['content'])
        print('-'*60)
