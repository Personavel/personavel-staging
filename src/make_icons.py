"""Make the app icons from the team logo (src/static/logo.png, square).
   python3 src/make_icons.py   – run again when the logo changes (needs Pillow)"""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'static')
logo = Image.open(os.path.join(S, 'logo.png')).convert('RGBA')
BG = logo.getpixel((4, 4))[:3]            # the logo's own blue background
def flat(im):                             # no transparency (iOS, Android launchers)
    out = Image.new('RGB', im.size, BG); out.paste(im, (0, 0), im); return out
def full(size): return flat(logo.resize((size, size), Image.LANCZOS))
full(512).save(os.path.join(S, 'icon-512.png'), optimize=True)
full(192).save(os.path.join(S, 'icon-192.png'), optimize=True)
full(180).save(os.path.join(S, 'apple-touch-icon.png'), optimize=True)
full(48).save(os.path.join(S, 'favicon-48.png'), optimize=True)
# maskable: Android may crop to a circle – keep the logo inside the 80 % safe zone
m = Image.new('RGB', (512, 512), BG); k = int(512 * .8); small = logo.resize((k, k), Image.LANCZOS)
m.paste(small, ((512 - k) // 2, (512 - k) // 2), small); m.save(os.path.join(S, 'icon-maskable-512.png'), optimize=True)
print('icons from logo, background', BG)
