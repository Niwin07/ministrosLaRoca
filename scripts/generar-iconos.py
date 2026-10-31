"""
Genera los íconos de la app desde el logo de la zarza, según el tablero
"Marca · Ícono de la app" del diseño:
  - Brasa: fondo radial(80% 70% at 50% 40%, #3a1009 0%, #160604 75%), logo claro.
  - Fuego (32 px): linear-gradient(150deg, #e0874a 0%, #b4472a 50%, #5e1f18 100%).
  - Esquinas: 30/128 del lado (las versiones "maskable"/Apple van a sangre).
Uso: python3 scripts/generar-iconos.py   (desde la raíz del repo)
"""
import numpy as np
from PIL import Image

LOGO = Image.open("public/zarza/logo-zarza.webp").convert("RGBA")
LOGO = LOGO.crop(LOGO.getbbox())

def hexrgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float)

def degradado(t, stops):
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,))
    pos = [p for p, _ in stops]; cols = [hexrgb(c) for _, c in stops]
    for k in range(3):
        out[..., k] = np.interp(t, pos, [c[k] for c in cols])
    return out

def fondo(n, tipo):
    y, x = np.mgrid[0:n, 0:n].astype(float) + 0.5
    if tipo == "brasa":
        d = np.sqrt(((x - 0.5 * n) / (0.8 * n)) ** 2 + ((y - 0.4 * n) / (0.7 * n)) ** 2)
        rgb = degradado(d / 0.75, [(0, "#3a1009"), (1, "#160604")])
    else:  # fuego, 150deg
        a = np.radians(150); dx, dy = np.sin(a), -np.cos(a)
        largo = abs(n * dx) + abs(n * dy)
        t = ((x - n / 2) * dx + (y - n / 2) * dy) / largo + 0.5
        rgb = degradado(t, [(0, "#e0874a"), (0.5, "#b4472a"), (1, "#5e1f18")])
    return Image.fromarray(rgb.astype(np.uint8), "RGB").convert("RGBA")

def esquinas(img, radio):
    n = img.size[0]; esc = 4
    m = Image.new("L", (n * esc, n * esc), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).rounded_rectangle([0, 0, n * esc - 1, n * esc - 1], radius=radio * esc, fill=255)
    img.putalpha(m.resize((n, n), Image.LANCZOS)); return img

# Proporción del diseño: el logo ocupa 54/128 del ancho del ícono.
ALTO = 54 / 128 * LOGO.height / LOGO.width

def icono(n, tipo="brasa", alto_logo=ALTO, redondeado=True):
    img = fondo(n, tipo)
    h = round(n * alto_logo); w = round(h * LOGO.width / LOGO.height)
    logo = LOGO.resize((w, h), Image.LANCZOS)
    img.alpha_composite(logo, ((n - w) // 2, (n - h) // 2))
    return esquinas(img, round(n * 30 / 128)) if redondeado else img

# PWA / Android (con esquinas del diseño) y versión maskable a sangre con zona segura.
icono(192).save("public/icon-192.png")
icono(512).save("public/icon-512.png")
icono(512, alto_logo=ALTO * 0.92, redondeado=False).convert("RGB").save("public/icon-maskable-512.png")
# Apple: a sangre (iOS redondea solo).
icono(180, redondeado=False).convert("RGB").save("app/apple-icon.png")
# Favicon: 16/32 en "Fuego" (como el 32 px del diseño), 48 en "Brasa".
ico = [icono(16, "fuego", 0.6), icono(32, "fuego", 14 / 32 * LOGO.height / LOGO.width), icono(48, "brasa", 20 / 48 * LOGO.height / LOGO.width)]
ico[2].save("app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
icono(64, "fuego", 14 / 32 * LOGO.height / LOGO.width).save("app/icon.png")
print("ok")
