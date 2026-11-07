"""Céu azul + cor de cinema + nitidez (1080x1920) para os quadros do reel."""
import cv2, numpy as np


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def sky_key(img, person=None):
    """img float RGB 0-1. Devolve (alpha do céu, imagem 'fechada' sem a grade)."""
    h, w = img.shape[:2]
    k = max(5, int(round(w / 720 * 7)) | 1)
    closed = cv2.morphologyEx(img, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)))
    hsv = cv2.cvtColor((closed * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32) / 255
    S, V = hsv[:, :, 1], hsv[:, :, 2]
    cand = ((S < 0.20) & (V > 0.50)).astype(np.uint8)
    # árvores e objetos escuros: afasta o recolorido das bordas
    dark = cv2.dilate((V < 0.44).astype(np.uint8), np.ones((int(w / 720 * 7) | 1,) * 2, np.uint8))
    cand[dark > 0] = 0
    # a pessoa não pode parecer "poste": preenche com o brilho típico do céu
    Vp = V.copy()
    if person is not None:
        pr = cv2.dilate((person > 0.05).astype(np.uint8), np.ones((int(w / 720 * 9) | 1,) * 2, np.uint8)) > 0
        ok = (cand > 0) & ~pr
        if ok.any():
            Vp[pr] = np.median(V[ok])
    # postes: faixas verticais estreitas mais escuras que o céu em volta
    Vb = cv2.blur(Vp, (int(w / 720 * 90) | 1, 1))
    D = np.clip(Vb - Vp, 0, 1)
    Dv = cv2.blur(D, (1, int(h / 1280 * 121) | 1))
    pole = cv2.dilate((Dv > 0.06).astype(np.uint8), np.ones((5, int(w / 720 * 9) | 1), np.uint8))
    cand[pole > 0] = 0
    # linha do horizonte: primeira faixa de grama (verde)
    H = hsv[:, :, 0] * 180
    green = ((H > 28) & (H < 70) & (S > 0.22)).mean(1)
    rows = np.nonzero(green > 0.35)[0]
    yg = rows[0] if len(rows) else int(h * 0.5)
    # só o que está ligado ao topo da imagem (o chão claro fica de fora)
    kk = int(w / 720 * 17) | 1
    conn = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, np.ones((kk, kk), np.uint8))  # atravessa trilhos e fios
    n, lab = cv2.connectedComponents(conn, connectivity=4)
    top = np.unique(lab[:max(2, h // 40)][conn[:max(2, h // 40)] > 0])
    keep = (np.isin(lab, top[top > 0]) & (cand > 0)).astype(np.float32)
    keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(keep, (0, 0), w / 720 * 2.0)
    a *= 1 - smooth(0.16, 0.26, S)
    yy = np.arange(h, dtype=np.float32)[:, None]
    a *= 1 - smooth(yg - 0.09 * h, yg - 0.02 * h, yy)
    return np.clip(a, 0, 1), closed


def recolor_sky(img, a, closed, strength=0.88, pct=None):
    h, w = img.shape[:2]
    Lc = closed @ np.array([.299, .587, .114], np.float32)
    Li = img @ np.array([.299, .587, .114], np.float32)
    sel = a > 0.5
    if sel.sum() < 500:
        return img
    p5, p95 = pct if pct else (np.percentile(Lc[sel], 6), np.percentile(Lc[sel], 97))
    nrm = np.clip((Lc - p5) / max(1e-3, p95 - p5), 0, 1)
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    yy = np.clip(y / 0.45, 0, 1)
    top, hor = np.array([.20, .45, .84], np.float32), np.array([.56, .74, .93], np.float32)
    blue = top[None, None] * (1 - yy[..., None]) + hor[None, None] * yy[..., None]
    cloud = np.array([.985, .975, .96], np.float32)[None, None] * (0.80 + 0.20 * nrm[..., None])
    c = smooth(0.30, 0.82, nrm)[..., None]
    new = blue * (1 - c) + cloud * c
    ratio = np.clip(Li / np.maximum(Lc, 1e-3), 0, 1)[..., None]   # devolve a grade/fios
    new = new * ratio
    A = (a * strength)[..., None]
    return img * (1 - A) + new * A


def grade(img, vignette=True):
    x = img
    # contraste em S suave com preto levemente levantado (filmic)
    x = x * 0.72 + smooth(0, 1, x) * 0.28
    x = 0.018 + 0.97 * x
    L = x @ np.array([.299, .587, .114], np.float32)
    # sombras levemente frias, altas luzes quentes (teal & orange sutil)
    sh = (1 - smooth(0.05, 0.55, L))[..., None]
    hi = smooth(0.45, 0.95, L)[..., None]
    x = x + sh * np.array([-.012, .006, .018], np.float32) + hi * np.array([.022, .008, -.016], np.float32)
    # saturação +10%
    L = (x @ np.array([.299, .587, .114], np.float32))[..., None]
    x = L + (x - L) * 1.10
    if vignette:
        h, w = x.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 * 0.8 + ((yy - h * 0.45) / (h / 2)) ** 2 * 0.7)
        x = x * (1 - 0.22 * smooth(0.55, 1.35, d))[..., None]
    return np.clip(x, 0, 1)


def sharpen(img, amt=0.55):
    b = cv2.GaussianBlur(img, (0, 0), 1.1)
    return np.clip(img + (img - b) * amt, 0, 1)


def process(bgr, person=None, out_size=(1080, 1920), pct=None):
    up = cv2.resize(bgr, out_size, interpolation=cv2.INTER_LANCZOS4)
    img = up[:, :, ::-1].astype(np.float32) / 255
    if person is not None:
        person = cv2.resize(person, out_size, interpolation=cv2.INTER_LINEAR)
    a, closed = sky_key(img, person)
    sky = recolor_sky(img, a, closed, pct=pct)
    if person is not None:
        pm = np.clip((person - 0.15) / 0.5, 0, 1)[..., None]
        sky = sky * (1 - pm) + img * pm
        a = a * (1 - pm[..., 0])
    img = sky
    img = grade(img)
    img = sharpen(img)
    return (img[:, :, ::-1] * 255 + .5).astype(np.uint8), a
