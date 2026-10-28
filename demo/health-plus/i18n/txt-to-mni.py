"""Turn the translated content file into i18n/mni.js.

Usage: python3 txt-to-mni.py "Health Plus content - for translation.txt"
Each piece of text sits under a "### key" line; the text below it (up to the next
blank line, ### line or --- / === divider) is the Romanised Meiteilon version.
A piece left in English simply stays English on the site.
"""
import json
import os
import sys

out, key, buf = {}, None, []


def flush():
    if key and buf:
        out[key] = ' '.join(s.strip() for s in buf).strip()


with open(sys.argv[1], encoding='utf-8') as f:
    for line in f:
        line = line.rstrip('\n')
        if line.startswith('### '):
            flush()
            key, buf = line[4:].strip(), []
        elif not line.strip() or line.startswith(('---', '===')):
            flush()
            key, buf = None, []
        elif key:
            buf.append(line)
flush()

here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, 'mni.js'), 'w', encoding='utf-8') as f:
    f.write('/* Romanised Meiteilon copy, generated from the translated content file by txt-to-mni.py.\n'
            '   Any key left out falls back to English. */\n')
    f.write('window.HP_I18N_MNI = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print(f'{len(out)} pieces written to mni.js')
