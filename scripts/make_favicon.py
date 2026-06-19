#!/usr/bin/env python3
"""Generate the FreeCell favicon set: two fanned playing cards.

Draws a high-resolution master image with Pillow, then exports the PNG sizes,
a multi-resolution .ico, and a matching safari-pinned-tab.svg.
"""
import os

from PIL import Image, ImageDraw

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "public")
PUBLIC = os.path.abspath(PUBLIC)

# Render at a large size and downscale for crisp anti-aliasing.
S = 1024
SS = 4  # supersample factor
W = S * SS

RED = (208, 48, 56, 255)
RED_DARK = (150, 28, 36, 255)
WHITE = (255, 255, 255, 255)
INK = (28, 32, 40, 255)
BORDER = (210, 214, 222, 255)
SHADOW = (0, 0, 0, 70)


def rounded_card(w, h, radius, fill, border=None, border_w=0):
    """Return an RGBA card image (white/colored rounded rectangle)."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=fill)
    if border and border_w:
        d.rounded_rectangle(
            [border_w // 2, border_w // 2, w - 1 - border_w // 2, h - 1 - border_w // 2],
            radius=radius,
            outline=border,
            width=border_w,
        )
    return img


def draw_heart(d, cx, cy, size, color):
    """Draw a heart suit pip centered at (cx, cy) on the given ImageDraw."""
    r = size * 0.27
    d.ellipse([cx - size * 0.5, cy - size * 0.42, cx - size * 0.5 + 2 * r,
               cy - size * 0.42 + 2 * r], fill=color)
    d.ellipse([cx + size * 0.5 - 2 * r, cy - size * 0.42, cx + size * 0.5,
               cy - size * 0.42 + 2 * r], fill=color)
    d.polygon([
        (cx - size * 0.5 + 0.04 * size, cy - size * 0.05),
        (cx + size * 0.5 - 0.04 * size, cy - size * 0.05),
        (cx, cy + size * 0.55),
    ], fill=color)


def draw_spade(d, cx, cy, size, color):
    """Draw a spade suit pip centered at (cx, cy) on the given ImageDraw."""
    r = size * 0.27
    top = cy - size * 0.5
    # two lobes (bottom-heavy heart shape, point up)
    d.ellipse([cx - size * 0.5, cy - size * 0.05, cx - size * 0.5 + 2 * r,
               cy - size * 0.05 + 2 * r], fill=color)
    d.ellipse([cx + size * 0.5 - 2 * r, cy - size * 0.05, cx + size * 0.5,
               cy - size * 0.05 + 2 * r], fill=color)
    d.polygon([
        (cx, top),
        (cx - size * 0.5, cy + size * 0.18),
        (cx + size * 0.5, cy + size * 0.18),
    ], fill=color)
    # stem
    d.polygon([
        (cx - size * 0.16, cy + size * 0.55),
        (cx + size * 0.16, cy + size * 0.55),
        (cx + size * 0.06, cy + size * 0.15),
        (cx - size * 0.06, cy + size * 0.15),
    ], fill=color)


def make_master():
    """Compose the fanned two-card favicon and downscale to target resolution."""
    canvas = Image.new("RGBA", (W, W), (0, 0, 0, 0))

    card_w = int(W * 0.56)
    card_h = int(W * 0.78)
    radius = int(W * 0.065)

    # --- Back card: red, fanned to the left ---
    back = rounded_card(card_w, card_h, radius, RED)
    bd = ImageDraw.Draw(back)
    # subtle inner panel for a classic card-back look
    inset = int(card_w * 0.12)
    bd.rounded_rectangle(
        [inset, inset, card_w - inset, card_h - inset],
        radius=int(radius * 0.6), outline=(255, 255, 255, 130),
        width=max(2, int(W * 0.006)),
    )
    back = back.rotate(20, expand=True, resample=Image.BICUBIC)

    # --- Front card: white with a spade ---
    front = rounded_card(card_w, card_h, radius, WHITE,
                         border=BORDER, border_w=max(2, int(W * 0.006)))
    fd = ImageDraw.Draw(front)
    draw_spade(fd, card_w // 2, int(card_h * 0.52), int(card_w * 0.5), INK)
    # corner pip
    draw_spade(fd, int(card_w * 0.2), int(card_h * 0.18), int(card_w * 0.16), INK)
    front = front.rotate(-8, expand=True, resample=Image.BICUBIC)

    # Shadow for the back card to add depth
    def shadow_of(layer, _blur_offset):
        """Return a semi-transparent shadow image matching the layer alpha."""
        sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
        alpha = layer.split()[3].point(lambda a: SHADOW[3] if a > 0 else 0)
        sh.putalpha(alpha)
        return sh

    cx = W // 2
    # Position the two cards, fanned and overlapping, centered.
    back_pos = (cx - back.width // 2 - int(W * 0.12), W // 2 - back.height // 2)
    front_pos = (cx - front.width // 2 + int(W * 0.09), W // 2 - front.height // 2)

    sh = shadow_of(back, 0)
    canvas.alpha_composite(sh, (back_pos[0] + int(W * 0.015), back_pos[1] + int(W * 0.02)))
    canvas.alpha_composite(back, back_pos)
    sh2 = shadow_of(front, 0)
    canvas.alpha_composite(sh2, (front_pos[0] + int(W * 0.015), front_pos[1] + int(W * 0.02)))
    canvas.alpha_composite(front, front_pos)

    # Downscale to target resolution.
    master = canvas.resize((S, S), Image.LANCZOS)
    return master


def export(master):
    """Write all favicon PNG sizes and a multi-resolution .ico to PUBLIC."""
    os.makedirs(PUBLIC, exist_ok=True)

    def save_png(size, name):
        """Resize the master image and save it as a square PNG."""
        img = master.resize((size, size), Image.LANCZOS)
        img.save(os.path.join(PUBLIC, name))
        print("wrote", name)

    save_png(16, "favicon-16x16.png")
    save_png(32, "favicon-32x32.png")
    save_png(192, "android-chrome-192x192.png")
    save_png(512, "android-chrome-512x512.png")
    save_png(150, "mstile-150x150.png")
    save_png(512, "playingcard.png")

    for sz in (57, 60, 72, 76, 114, 120, 144, 152, 180):
        save_png(sz, f"apple-touch-icon-{sz}x{sz}.png")
        save_png(sz, f"apple-touch-icon-{sz}x{sz}-precomposed.png")
    save_png(180, "apple-touch-icon.png")
    save_png(180, "apple-touch-icon-precomposed.png")

    # Multi-resolution ICO
    ico = master.resize((256, 256), Image.LANCZOS)
    ico.save(os.path.join(PUBLIC, "favicon.ico"),
             sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("wrote favicon.ico")


if __name__ == "__main__":
    export(make_master())
