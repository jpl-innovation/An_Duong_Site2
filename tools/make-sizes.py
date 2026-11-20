"""Make the smaller copies of every site photo: name-w640.jpg and name-w1280.jpg next to name.jpg.

The page offers all three (srcset) and the browser downloads the one that fits the frame, so a
thumbnail never decodes a 3-megapixel original mid-scroll. Originals are never changed, and a photo
already narrower than a size is copied byte for byte, never enlarged. Run again after adding photos:
    python tools/make-sizes.py
"""
import pathlib, shutil
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'img'
made = 0
for src in ROOT.rglob('*'):
    if src.suffix.lower() not in ('.jpg', '.jpeg') or '-w640' in src.stem or '-w1280' in src.stem:
        continue
    for w in (640, 1280):
        out = src.with_name(f'{src.stem}-w{w}.jpg')
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            continue
        with Image.open(src) as im:
            if im.width <= w:
                shutil.copyfile(src, out)
            else:
                icc = im.info.get('icc_profile')
                im = im.convert('RGB').resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                im.save(out, 'JPEG', quality=88, progressive=True, optimize=True, subsampling=0, **({'icc_profile': icc} if icc else {}))
        made += 1
print('made', made)
