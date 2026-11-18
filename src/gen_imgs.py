"""Turn the original image bank (imgs*.js) into: imgs_desk.js (compressed WebP, inline) and web/img/*.webp + imgs_web.js (separate files)."""
import json,base64,io,os,subprocess
HERE=os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE); os.makedirs('/tmp/imgx',exist_ok=True)
from PIL import Image
subprocess.run(['node','-e',"global.window=global;for(const f of ['imgs.js','imgs2.js','imgs3.js'])eval(require('fs').readFileSync(f,'utf8'));require('fs').writeFileSync('/tmp/imgx/all.json',JSON.stringify({img:PV_IMG,gal:PV_GALLERY}))"],check=True)
d=json.load(open('/tmp/imgx/all.json'))
def enc(b,maxw,q):
    im=Image.open(io.BytesIO(base64.b64decode(b.split(',',1)[1]))).convert('RGB')
    if im.width>maxw: im=im.resize((maxw,round(im.height*maxw/im.width)),Image.LANCZOS)
    o=io.BytesIO(); im.save(o,'WEBP',quality=q,method=6); return o.getvalue()
uri=lambda w:'data:image/webp;base64,'+base64.b64encode(w).decode()
meta=lambda g:{k:v for k,v in g.items() if k!='src'}
# desktop: one self-contained file, lighter images
di={k:uri(enc(v,640,62)) for k,v in d['img'].items()}
dg=[dict(meta(g),src=uri(enc(g['src'],1280,60))) for g in d['gal']]
open('imgs_desk.js','w').write('window.PV_IMG='+json.dumps(di)+';\nwindow.PV_GALLERY='+json.dumps(dg,ensure_ascii=False)+';\n')
# web: separate files, loaded only when shown
W=os.path.join(os.path.dirname(HERE),'img'); os.makedirs(W+'/t',exist_ok=True)
wi,wt,wg={},{},[]
for k,v in d['img'].items():
    open(f'{W}/{k}.webp','wb').write(enc(v,760,72)); wi[k]=f'img/{k}.webp'
    open(f'{W}/t/{k}.webp','wb').write(enc(v,160,70)); wt[k]=f'img/t/{k}.webp'
for i,g in enumerate(d['gal']):
    open(f'{W}/g{i}.webp','wb').write(enc(g['src'],1600,66)); wg.append(dict(meta(g),src=f'img/g{i}.webp'))
open('imgs_web.js','w').write('window.PV_IMG='+json.dumps(wi)+';\nwindow.PV_THUMB='+json.dumps(wt)+';\nwindow.PV_GALLERY='+json.dumps(wg,ensure_ascii=False)+';\n')
print('desk js KB',os.path.getsize('imgs_desk.js')//1024,'web js KB',os.path.getsize('imgs_web.js')//1024)
