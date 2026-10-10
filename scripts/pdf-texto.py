# .materia-venv/bin/python -I scripts/pdf-texto.py entrada.pdf salida.txt
# Extrae el texto de un PDF (lo usa scripts/materia-inventario.mjs). Imprime: páginas y caracteres.
import sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
partes = []
for i, p in enumerate(r.pages):
    try:
        t = p.extract_text() or ''
    except Exception:
        t = ''
    partes.append('\n[página %d]\n%s' % (i + 1, t))
texto = '\n'.join(partes)
open(sys.argv[2], 'w', encoding='utf-8').write(texto)
print(len(r.pages), len(texto.replace('\n', '').replace(' ', '')))
