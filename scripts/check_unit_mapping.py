import re, os
subj_dir = 'src/subjects'
unit_keys = set()
for fname in os.listdir(subj_dir):
    if fname.endswith('.ts') and fname not in ('index.ts', 'utils.ts', 'unit-display-name-map.ts'):
        text = open(os.path.join(subj_dir, fname), encoding='utf-8').read()
        unit_keys |= set(re.findall(r'\b([A-Z0-9_]+_U\d{2})\b', text))
map_text = open('src/subjects/unit-display-name-map.ts', encoding='utf-8').read()
map_keys = set(re.findall(r'"([A-Z0-9_]+_U\d{2})"', map_text))
missing = sorted(unit_keys - map_keys)
extra = sorted(map_keys - unit_keys)
print('total unit_keys', len(unit_keys))
print('total map_keys', len(map_keys))
print('missing count', len(missing))
print('extra count', len(extra))
print('missing sample', missing[:30])
print('extra sample', extra[:30])
