import re
html = open(r"C:\Temp\v7-savanna.html", encoding="utf-8", errors="replace").read()
# first few animal buttons with inline style
for m in re.finditer(r'data-id="([^"]+)"[^>]*style="([^"]+)"', html):
    style = m.group(2)
    if "left:" not in style:
        continue
    left = re.search(r"left:\s*([0-9.]+)px", style)
    top = re.search(r"top:\s*([0-9.]+)px", style)
    h = re.search(r"height:\s*([0-9.]+)px", style)
    if not left:
        continue
    L = float(left.group(1))
    if 0 < L < 20000:
        print(m.group(1), "left", round(L), "top", round(float(top.group(1))) if top else None, "h", round(float(h.group(1))) if h else None)
        if L > 3000:
            break
