from pathlib import Path

def extract(text, key):
    token = f'"{key}":'
    i = text.find(token)
    if i < 0:
        return None
    i = text.find("{", i)
    depth = 0
    for j in range(i, len(text)):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                return text[i : j + 1]
    return None

root = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")
text = (root / "animation-data.js").read_text(encoding="utf-8")
for key in ("hippo", "toucan", "elephant"):
    print("====", key)
    print(extract(text, key))
    print()
