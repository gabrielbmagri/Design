# Gera os logos da Confete em SVG (texto convertido em curvas, sem depender de fonte instalada).
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
FONT = TTFont('fonts/BagelFatOne-Regular.ttf'); GS = FONT.getGlyphSet(); CMAP = FONT.getBestCmap(); UPM = FONT['head'].unitsPerEm
PINK, BUTTER, SKY, MINT, CREAM, INK = '#FF5FA2', '#FFD84D', '#5BC8F5', '#7EE0B5', '#FFF8EC', '#2A1B3D'
def word(text, size, tracking=0):
    """caminho SVG de uma palavra, origem no canto superior-esquerdo da linha de base ascendente"""
    s = size / UPM; x = 0; d = []
    for ch in text:
        g = CMAP[ord(ch)]; pen = SVGPathPen(GS)
        tp = TransformPen(pen, (s, 0, 0, -s, x, 0)); GS[g].draw(tp); d.append(pen.getCommands())
        x += GS[g].width * s + tracking
    return ' '.join(d), x
def confetti(cx, cy, k=1.0, colors=(PINK, BUTTER, SKY, MINT)):
    """pecinhas de confete: retângulo, círculo, estrela, ziguezague"""
    P = []; c = colors
    P.append(f'<rect x="{cx-10*k}" y="{cy-4*k}" width="{20*k}" height="{8*k}" rx="{3*k}" fill="{c[1%len(c)]}" transform="rotate(-28 {cx} {cy})"/>')
    return ''.join(P)
def svg_wordmark(variant='principal', bg=None):
    size = 300; tr = -6
    path, w = word('confete', size, tr)
    asc = size * 0.78            # altura aproximada do corpo
    W = int(w + 120); H = int(size * 1.02 + 90)
    ox, oy = 60, size * 0.88 + 30
    if variant == 'principal':   fill, s1, s2 = PINK, BUTTER, SKY
    elif variant == 'mono-tinta': fill, s1, s2 = INK, None, None
    elif variant == 'mono-branco': fill, s1, s2 = '#FFFFFF', None, None
    elif variant == 'creme':     fill, s1, s2 = CREAM, PINK, INK
    layers = ''
    if s2: layers += f'<path d="{path}" transform="translate({ox+14},{oy+14})" fill="{s2}"/>'
    if s1: layers += f'<path d="{path}" transform="translate({ox+7},{oy+7})" fill="{s1}"/>'
    layers += f'<path d="{path}" transform="translate({ox},{oy})" fill="{fill}"/>'
    # confetes ao redor (cores fixas na versão principal; monocromáticos nas demais)
    cols = (PINK, BUTTER, SKY, MINT) if variant == 'principal' else (fill,) * 4
    if variant == 'creme': cols = (PINK, BUTTER, SKY, MINT)
    bits = [
        (w*0.04+ox, oy-size*0.60, -28, 'rect', cols[1]), (w*0.18+ox, oy-size*0.88, 18, 'dot', cols[2]),
        (w*0.43+ox, oy-size*0.92, 40, 'rect', cols[3]), (w*0.62+ox, oy-size*0.84, -12, 'star', cols[1]),
        (w*0.84+ox, oy-size*0.78, 30, 'rect', cols[0] if variant!='principal' else PINK), (w*0.97+ox, oy-size*0.50, 0, 'dot', cols[3]),
        (w*0.99+ox, oy+size*0.06, 22, 'squig', cols[2]), (w*0.02+ox, oy+size*0.08, -18, 'dot', cols[0] if variant!='principal' else PINK),
    ]
    out = ''
    for x, y, r, kind, col in bits:
        if kind == 'rect': out += f'<rect x="{x-17}" y="{y-7}" width="44" height="18" rx="8" fill="{col}" transform="rotate({r} {x} {y})"/>'
        elif kind == 'dot': out += f'<circle cx="{x}" cy="{y}" r="14" fill="{col}"/>'
        elif kind == 'star':
            pts = ' '.join(f'{x+(24 if i%2==0 else 10)*__import__("math").cos(i*3.14159/4-1.5708):.1f},{y+(24 if i%2==0 else 10)*__import__("math").sin(i*3.14159/4-1.5708):.1f}' for i in range(8))
            out += f'<polygon points="{pts}" fill="{col}" transform="rotate({r} {x} {y})"/>'
        elif kind == 'squig': out += f'<path d="M{x-16},{y} q8,-12 16,0 t16,0" fill="none" stroke="{col}" stroke-width="7" stroke-linecap="round" transform="rotate({r} {x} {y})"/>'
    bgrect = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{bgrect}{layers}{out}</svg>'
def svg_icon(variant='principal'):
    path, w = word('c', 800, 0)
    S = 1024
    if variant == 'principal': bg, fill, s1 = PINK, CREAM, BUTTER
    elif variant == 'butter': bg, fill, s1 = BUTTER, PINK, SKY
    elif variant == 'tri': bg, fill, s1 = CREAM, PINK, BUTTER
    else: bg, fill, s1 = INK, PINK, BUTTER
    ox = (S - w) / 2 - 12; oy = S * 0.5 + 800 * 0.30
    conf = ''.join(
        f'<rect x="{x-18}" y="{y-8}" width="36" height="16" rx="7" fill="{c}" transform="rotate({r} {x} {y})"/>' if k == 'r' else f'<circle cx="{x}" cy="{y}" r="13" fill="{c}"/>'
        for x, y, r, k, c in [(200, 180, -25, 'r', BUTTER if variant != 'butter' else PINK), (820, 160, 30, 'r', SKY), (880, 800, -20, 'r', MINT), (150, 780, 0, 'd', BUTTER if variant != 'butter' else SKY), (770, 880, 0, 'd', CREAM), (300, 90, 0, 'd', MINT)])
    tri = variant == 'tri'
    shadows = ''
    if tri: shadows += f'<path d="{path}" transform="translate({ox+34},{oy+34})" fill="{SKY}"/>'
    d = 17 if tri else 16
    shadows += f'<path d="{path}" transform="translate({ox+d},{oy+d})" fill="{s1}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}"><rect width="{S}" height="{S}" fill="{bg}"/>'
            + shadows + f'<path d="{path}" transform="translate({ox},{oy})" fill="{fill}"/>{conf}</svg>')
for v in ['principal', 'mono-tinta', 'mono-branco', 'creme']:
    open(f'logos/confete-{v}.svg', 'w').write(svg_wordmark(v))
for v in ['principal', 'butter', 'tinta', 'tri']:
    open(f'logos/confete-icone-{v}.svg', 'w').write(svg_icon(v))
print('ok')
