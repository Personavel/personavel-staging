"""Build Personavel from src/.
   python3 src/build.py        -> dist/personavel.html  (one self-contained file, images inline)
   python3 src/build.py web    -> index.html            (GitHub Pages; images loaded from img/)"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
P = lambda *a: os.path.join(HERE, *a)
WEB = len(sys.argv) > 1 and sys.argv[1] == 'web'
MODULES = [('imgs_web.js' if WEB else 'imgs_desk.js'), 'data.js', 'app1.js', 'app2.js', 'i18n.js', 'app3.js', 'coll.js', 'theme.js',
           'moments.js', 'community.js', 'reviews.js', 'visited.js', 'weather.js', 'tips.js', 'nlu.js', 'traffic.js', 'tripplus.js', 'nav.js',
           'mapstyle.js', 'fun.js', 'gestures.js', 'appreview.js', 'app4.js']
rd = lambda f: open(f, encoding='utf-8').read()
leaf = rd(P('vendor', 'leaflet.js'))
css = rd(P('vendor', 'leaflet.css')) + '\n' + rd(P('style.css')) + '\n' + rd(P('font_brush.css'))
js = '\n'.join(rd(P(f)) for f in MODULES)
html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Personavel – Bản đồ du lịch tự túc TP.HCM</title>
<meta name="description" content="Personavel – nền tảng bản đồ du lịch tự túc, thuyết minh và gợi ý lịch trình cá nhân hóa tại TP.HCM. Dự án của nhóm 11A13, THPT Lê Quý Đôn.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Dancing+Script:wght@600;700&family=Faustina:wght@400;500;600;700&display=swap&subset=vietnamese" rel="stylesheet">
<style>
{css}
</style>
<script>
{leaf}
</script>
</head>
<body>
<script>
{js}
</script>
</body>
</html>
'''
out = os.path.join(ROOT, 'index.html') if WEB else os.path.join(ROOT, 'dist', 'personavel.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html))
