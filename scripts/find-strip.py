import re
html = open(r"C:\Temp\v7-savanna.html", encoding="utf-8", errors="replace").read()
m = re.search(r'id="strip"[^>]*style="([^"]*)"', html)
print("strip", (m.group(1)[:240] if m else "none"))
print("lion", html.count('data-id="lion"'))
print("v1 lion", html.count("v1/animals/lion.webp"))
