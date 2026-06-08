import os
import re

path = 'C:/Users/fanwi/Antigravity proyects/mesbg-app/js/liga_final_v6.js'
if os.path.exists(path):
    print("Found liga_final_v6.js! Searching for matches write/add...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # search lines containing matches and setDoc/addDoc/updateDoc
    lines = content.split('\n')
    for idx, line in enumerate(lines):
        if 'matches' in line and ('addDoc' in line or 'setDoc' in line or 'updateDoc' in line):
            print(f"Line {idx+1}: {line.strip()}")
else:
    print("liga_final_v6.js not found at that path.")
