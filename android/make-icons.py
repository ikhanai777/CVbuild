"""Draws the launcher icons: a navy tile, "CV" in white, a gold rule and an
eight-point star (the Mashrabiya template's motif). Run by build.sh; needs Pillow."""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

RES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'res')
NAVY = (11, 37, 69, 255)
GOLD = (196, 160, 98, 255)
WHITE = (255, 255, 255, 255)
FONT = next(
    p
    for p in [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    ]
    if os.path.exists(p)
)


def star(draw, cx, cy, r, fill):
    pts = []
    for i in range(16):
        rad = r if i % 2 == 0 else r * 0.62
        a = math.pi / 8 * i - math.pi / 2
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    draw.polygon(pts, fill=fill)


def mark(draw, size, cx, cy, scale):
    """The CV mark, centred on (cx, cy); scale is the mark's nominal width."""
    font = ImageFont.truetype(FONT, int(scale * 0.46))
    text = 'CV'
    box = draw.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    ty = cy - h * 0.62
    draw.text((cx - w / 2 - box[0], ty - box[1]), text, font=font, fill=WHITE)
    rule_y = ty + h + scale * 0.1
    draw.rounded_rectangle(
        [cx - scale * 0.26, rule_y, cx + scale * 0.26, rule_y + scale * 0.035],
        radius=scale * 0.02,
        fill=GOLD,
    )
    star(draw, cx, rule_y + scale * 0.17, scale * 0.075, GOLD)


def legacy(px):
    s = px * 4  # supersample, then downscale for smooth edges
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([s * 0.04, s * 0.04, s * 0.96, s * 0.96], radius=s * 0.2, fill=NAVY)
    mark(d, s, s / 2, s / 2, s * 0.8)
    return img.resize((px, px), Image.LANCZOS)


def foreground(px):
    # Adaptive icons: 108dp canvas, only the central 66dp is guaranteed visible.
    s = px * 4
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    mark(d, s, s / 2, s / 2, s * 0.52)
    return img.resize((px, px), Image.LANCZOS)


for density, base in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
    folder = os.path.join(RES, f'mipmap-{density}')
    os.makedirs(folder, exist_ok=True)
    legacy(int(48 * base)).save(os.path.join(folder, 'ic_launcher.png'))
    foreground(int(108 * base)).save(os.path.join(folder, 'ic_launcher_foreground.png'))

legacy(512).save(os.path.join(RES, '..', 'icon-512.png'))
print('icons written to', RES)
