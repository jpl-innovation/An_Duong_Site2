"""Build one complete, filled-in raea prompt file per model from docs/3D-PROMPTS.md."""
import os, re
ROOT = 'D:\\Rum website\\ctyanduong\\ctyanduong'
DOC = os.path.join(ROOT, 'docs', '3D-PROMPTS.md')
OUT = os.path.join(ROOT, 'docs', 'raea')
s = open(DOC, encoding='utf-8').read()

def section(title_start):
    i = s.index('\n## ' + title_start)
    j = s.find('\n## ', i + 5)
    return s[i:j if j > 0 else len(s)]

def blocks(text):
    return re.findall(r'```\n(.*?)```', text, re.S)

def rows(text):
    out = []
    for line in text.splitlines():
        cells = [c.strip() for c in re.findall(r'\|([^|]*)', line)][:-1] if line.startswith('| `') else None
        if not cells: continue
        name = cells[0].strip('`').replace('.glb', '')
        prompt = cells[-1].strip('`')
        photos = re.findall(r'`(D:[^`]*)`', cells[1]) if len(cells) == 3 else []
        out.append((name, photos, prompt))
    return out

general = blocks(section('1.'))[0].strip()
furn_group = blocks(section('3.'))[0].strip()
phase_group = blocks(section('5.'))[0].strip()
room_names = blocks(section('6.'))[0].strip()
detail_group = blocks(section('7.'))[0].strip()
phase_photos = re.findall(r'`(D:[^`]*)`', section('5.').split('| Tệp')[0])
detail_photos = re.findall(r'`(D:[^`]*)`', section('7.').split('| Tệp')[0])

IMG = lambda *a: [os.path.join(ROOT, 'img', *x.split('/')) for x in a]
STAGE = {
    'phase-0': IMG('fb/log/13.jpg', 'fb/log/19.jpg', 'equipment/ep-coc.jpg'),
    'phase-1': IMG('fb/daugiay/03.jpg', 'fb/log/15.jpg', 'fb/log/21.jpg', 'fb/log/04.jpg'),
    'phase-2': IMG('fb/mia/03.jpg', 'fb/log/02.jpg', 'fb/log/04.jpg', 'equipment/gian-giao.jpg', 'equipment/chong-tang.jpg'),
    'phase-3': IMG('fb/mia', 'fb/daugiay', 'equipment/gian-giao.jpg'),
    'phase-4': IMG('fb/log/02.jpg', 'equipment/gian-giao.jpg'),
    'phase-5': IMG('fb/nhapho2022', 'fb/log/12.jpg'),
    'phase-6': IMG('fb/nhapho2022', 'fb/log/12.jpg'),
}
DETAIL = {
    'chi-tiet-coc-mong': IMG('fb/log/13.jpg', 'fb/log/19.jpg'),
    'chi-tiet-cot': IMG('fb/log/04.jpg', 'fb/log/15.jpg', 'equipment/chong-tang.jpg'),
    'chi-tiet-dam-san': IMG('fb/log/04.jpg', 'fb/log/15.jpg', 'equipment/chong-tang.jpg'),
    'chi-tiet-tuong': IMG('fb/mia', 'fb/daugiay'),
    'chi-tiet-chong-tham': [],
}
models = []  # (name, photos, group, prompt)
for n, ph, p in rows(section('2.')): models.append((n, ph, None, p))
for n, ph, p in rows(section('3.')): models.append((n, ph, furn_group, p))
for n, ph, p in rows(section('4.')):
    models.append((n, ph, None, p + '\n\nIMPORTANT: name the exterior paint material exactly "Render" (the website recolours it).'))
for n, ph, p in rows(section('6.')): models.append((n, ph, None, p + '\n\n' + room_names))
phases = rows(section('5.'))
for n, ph, p in reversed(phases):  # finished house first, then peel back, so all stages line up
    k = int(n.split('-')[1])
    models.append((n, STAGE[n], phase_group.replace('stage N', 'stage %d' % (k + 1)), p))
for n, ph, p in rows(section('7.')): models.append((n, DETAIL[n], detail_group, p))
assert len(models) == 31, len(models)

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.txt') and not f.startswith('00-'): os.remove(os.path.join(OUT, f))  # 00-site-goals.txt is kept
for i, (n, ph, group, p) in enumerate(models, 1):
    ref = os.path.join(ROOT, 'models', 'reference', n + '.png')
    lines = ['MODEL %d OF 31: %s' % (i, n), '', 'FILES (read and write directly on this computer)',
             '- Source model to rebuild (read only): ' + os.path.join(ROOT, 'models', 'source', n + '.glb')]
    if os.path.exists(ref): lines.append('- Screenshot of how it looks on the website now (read only): ' + ref)
    if ph:
        lines.append('- Real ADDC photos to match materials and the site look (read only; a folder means pick the relevant shots in it):')
        lines += ['  ' + x for x in ph]
    lines += ['- Save the finished model as: ' + os.path.join(ROOT, 'models', n + '.glb'),
              '- Never modify, move or delete anything in models\\source, models\\reference, img, js, css, docs or any .html file.',
              '', general, '']
    if group: lines += [group, '']
    lines += ['THIS MODEL', p, '']
    open(os.path.join(OUT, '%02d-%s.txt' % (i, n)), 'w', encoding='utf-8').write('\n'.join(lines))
    assert os.path.exists(os.path.join(ROOT, 'models', 'source', n + '.glb')), n
    for x in ph: assert os.path.exists(x), x
print('\n'.join(sorted(os.listdir(OUT))))
