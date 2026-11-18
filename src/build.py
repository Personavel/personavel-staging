"""Build Personavel from src/.
   python3 src/build.py        -> dist/personavel.html  (one self-contained file for offline use, images inline)
   python3 src/build.py web    -> index.html + assets/ + sw.js (GitHub Pages: minified, cached, Leaflet loaded on demand)
   Minifying uses esbuild through npx (needs Node); if it is not available the files are written unminified."""
import os, sys, json, hashlib, subprocess, shutil, glob, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
P = lambda *a: os.path.join(HERE, *a)
WEB = len(sys.argv) > 1 and sys.argv[1] == 'web'
APP = ['app1.js', 'app2.js', 'i18n.js', 'app3.js', 'coll.js', 'theme.js', 'moments.js', 'community.js', 'reviews.js', 'visited.js',
       'weather.js', 'tips.js', 'nlu.js', 'traffic.js', 'tripplus.js', 'nav.js', 'mapstyle.js', 'fun.js', 'gestures.js', 'appreview.js', 'app4.js']
rd = lambda f: open(f, encoding='utf-8').read()
FONTS = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Dancing+Script:wght@600;700&family=Faustina:wght@400;600;700&display=swap&subset=vietnamese'
TITLE = 'Personavel – Bản đồ du lịch tự túc TP.HCM'
DESC = 'Personavel – nền tảng bản đồ du lịch tự túc, thuyết minh và gợi ý lịch trình cá nhân hóa tại TP.HCM. Dự án của nhóm 11A13, THPT Lê Quý Đôn.'
SITE = 'https://personavel.github.io/'

def minify(code, loader):
    try:
        r = subprocess.run(['npx', '-y', 'esbuild@0.28.2', '--minify', '--loader=' + loader, '--charset=utf8', '--log-level=error'],
                           input=code.encode('utf-8'), capture_output=True, timeout=180)
        if r.returncode == 0 and r.stdout: return r.stdout.decode('utf-8')
        print('esbuild:', r.stderr.decode()[:400])
    except Exception as e: print('esbuild unavailable:', e)
    return code

def head(extra=''):
    return f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#3D7FB8">
<link rel="icon" href="{'assets/icon-192.png' if WEB else ''}" type="image/png">
{extra}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet">'''

if not WEB:
    # ---------- single offline file ----------
    css = rd(P('vendor', 'leaflet.css')) + '\n' + rd(P('style.css')) + '\n' + rd(P('font_brush.css'))
    js = '\n'.join(rd(P(f)) for f in ['imgs_desk.js', 'data.js'] + APP)
    html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
{head().replace('<link rel="icon" href="" type="image/png">', '')}
<style>
{minify(css, 'css')}
</style>
<script>
{rd(P('vendor', 'leaflet.js'))}
</script>
</head>
<body>
<script>
{minify(js, 'js')}
</script>
</body>
</html>
'''
    out = os.path.join(ROOT, 'dist', 'personavel.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html); print(out, len(html.encode()))
    sys.exit()

# ---------- web build ----------
A = os.path.join(ROOT, 'assets'); os.makedirs(A, exist_ok=True)
def emit(name, ext, content):
    h = hashlib.sha256(content.encode('utf-8')).hexdigest()[:10]
    fn = f'{name}.{h}.{ext}'
    for old in glob.glob(os.path.join(A, f'{name}.*.{ext}')):
        if os.path.basename(old) != fn: os.remove(old)
    open(os.path.join(A, fn), 'w', encoding='utf-8').write(content)
    return 'assets/' + fn
import re, base64
def font_files(css):
    def rep(m):
        raw = base64.b64decode(m.group(2)); h = hashlib.sha256(raw).hexdigest()[:10]; fn = f'pvbrush.{h}.woff2'
        open(os.path.join(A, fn), 'wb').write(raw); return f'url({fn})'
    for old in glob.glob(os.path.join(A, 'pvbrush.*.woff2')): os.remove(old)
    return re.sub(r'url\((["\']?)data:font/woff2;base64,([A-Za-z0-9+/=]+)\1\)', rep, css)
app_css = emit('app', 'css', minify(rd(P('style.css')) + '\n' + font_files(rd(P('font_brush.css'))), 'css'))
data_js = emit('data', 'js', minify(rd(P('imgs_web.js')) + '\n' + rd(P('data.js')), 'js'))
app_js = emit('app', 'js', minify('\n'.join(rd(P(f)) for f in APP), 'js'))
lf_css = emit('leaflet', 'css', minify(rd(P('vendor', 'leaflet.css')), 'css'))
lf_js = emit('leaflet', 'js', rd(P('vendor', 'leaflet.js')))
for f in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'og.jpg']:
    if os.path.exists(P('static', f)): shutil.copy(P('static', f), os.path.join(A, f))

ng = rd(P('imgs_web.js')).count('img/g')
seo = f'''<link rel="canonical" href="{SITE}">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Personavel">
<meta property="og:title" content="{TITLE}"><meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}"><meta property="og:image" content="{SITE}assets/og.jpg"><meta property="og:locale" content="vi_VN"><meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{TITLE}"><meta name="twitter:description" content="{DESC}"><meta name="twitter:image" content="{SITE}assets/og.jpg">
<script>(function(){{try{{var i=(JSON.parse(localStorage.getItem('pv_heroIdx'))+1)%{ng};if(!(i>=0))i=0}}catch(e){{i=0}}var l=document.createElement('link');l.rel='preload';l.as='image';l.setAttribute('imagesrcset','img/g'+i+'-800.webp 800w, img/g'+i+'-1200.webp 1200w, img/g'+i+'.webp 1600w');l.setAttribute('imagesizes','100vw');l.setAttribute('fetchpriority','high');document.head.appendChild(l)}})()</script><link rel="preload" href="{app_css}" as="style"><link rel="preload" href="{data_js}" as="script"><link rel="preload" href="{app_js}" as="script">
'''
# a tiny first screen painted before the app script runs (removed by PV.init)
boot = '''<div id="boot" aria-hidden="true"><div class="boot-bot"></div><b>Personavel</b><span>Your trip · Your story</span></div>'''
boot_css = '#boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(160deg,#F4F9FE,#DCEBF8 60%,#CFE3F6);color:#1F4E79;font-family:Nunito,system-ui,sans-serif;z-index:1}#boot b{font-size:34px;font-weight:800;letter-spacing:.5px}#boot span{font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.7}.boot-bot{width:54px;height:54px;border-radius:50%;border:5px solid #CFE3F6;border-top-color:#3D7FB8;animation:bspin 1s linear infinite}@keyframes bspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.boot-bot{animation:none}}'
html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
{head(seo)}
<link rel="stylesheet" href="{app_css}">
<style>{boot_css}</style>
<script>window.PV_LEAFLET={{css:"{lf_css}",js:"{lf_js}"}};</script>
<script defer src="{data_js}"></script>
<script defer src="{app_js}"></script>
</head>
<body>
{boot}
<noscript><p style="padding:20px;font-family:sans-serif">Personavel cần bật JavaScript. · Personavel needs JavaScript enabled.</p></noscript>
<script>if('serviceWorker' in navigator && location.protocol==='https:'){{addEventListener('load',function(){{navigator.serviceWorker.register('sw.js').catch(function(){{}})}})}}</script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)

# PWA: manifest + service worker (precache the app shell; images cached when first seen)
json.dump({"name": "Personavel – Bản đồ du lịch tự túc TP.HCM", "short_name": "Personavel", "lang": "vi", "start_url": "./#home", "scope": "./",
           "display": "standalone", "background_color": "#F4F9FE", "theme_color": "#3D7FB8", "description": DESC,
           "icons": [{"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
                     {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
                     {"src": "assets/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(os.path.join(ROOT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ver = hashlib.sha256((app_js + app_css + data_js + lf_js).encode()).hexdigest()[:10]
shell = ['./', 'index.html', app_css, data_js, app_js, lf_css, lf_js, 'manifest.json', 'assets/icon-192.png']
open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(f'''/* Personavel service worker – generated by src/build.py ({ver}) */
const V = 'pv-{ver}', SHELL = {json.dumps(shell)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'pv-img').map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;            // maps, Supabase, routing: always live
  if (e.request.mode === 'navigate') {{                                               // page: network first, offline copy as fallback
    e.respondWith(fetch(e.request).then(r => {{ const c = r.clone(); caches.open(V).then(x => x.put('index.html', c)); return r; }}).catch(() => caches.match('index.html')));
    return;
  }}
  if (u.pathname.includes('/img/')) {{                                                // photos: cache first
    e.respondWith(caches.open('pv-img').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {{ if (r.ok) c.put(e.request, r.clone()); return r; }}))));
    return;
  }}
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));       // hashed assets: cache first
}});
''')
today = datetime.date.today().isoformat()
open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{SITE}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq></url></urlset>\n')
open(os.path.join(ROOT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n')
sizes = {k: os.path.getsize(os.path.join(ROOT, v)) for k, v in [('index', 'index.html'), ('app.js', app_js), ('app.css', app_css), ('data.js', data_js), ('leaflet.js', lf_js)]}
print('web build', sizes)
