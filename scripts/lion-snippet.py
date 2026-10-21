html = open(r"C:\Temp\v7-savanna.html", encoding="utf-8", errors="replace").read()
i = html.find('data-id="lion"')
print(html[i-200:i+900])
