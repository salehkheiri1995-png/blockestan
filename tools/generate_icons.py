"""Draws the Blockestan launcher icon (adaptive vector + legacy rasters) from scratch.

Only the Python standard library is used. Run from the project root:
    python tools/generate_icons.py
"""
from __future__ import annotations

import math
import os
import struct
import zlib

ROOT = os.path.join("app", "src", "main", "res")
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

TEAL_DARK = (11, 92, 84)
TEAL = (15, 118, 110)
MINT = (94, 234, 212)
GOLD = (250, 204, 21)
CORAL = (251, 113, 133)
CREAM = (255, 251, 235)


def png_bytes(width: int, height: int, pixel) -> bytes:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend(pixel(x, y))
    compressed = zlib.compress(bytes(raw), 9)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")


def rounded_mask(x: float, y: float, size: float, radius: float) -> bool:
    if x < 0 or y < 0 or x >= size or y >= size:
        return False
    cx = min(max(x, radius), size - radius)
    cy = min(max(y, radius), size - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def render_icon(size: int, round_icon: bool):
    radius = size / 2 if round_icon else size * 0.22
    # Block layout is defined in a 108 unit design space and scaled to the raster size.
    blocks = [
        (38, 38, 30, 10, MINT),
        (54, 38, 14, 14, GOLD),
        (38, 54, 14, 14, CORAL),
        (54, 54, 14, 14, CREAM),
    ]

    def pixel(x: int, y: int) -> bytes:
        px = x + 0.5
        py = y + 0.5
        if not rounded_mask(px, py, size, radius):
            return b"\x00\x00\x00\x00"
        # Vertical gradient background.
        t = py / size
        r = int(TEAL_DARK[0] + (TEAL[0] - TEAL_DARK[0]) * t)
        g = int(TEAL_DARK[1] + (TEAL[1] - TEAL_DARK[1]) * t)
        b = int(TEAL_DARK[2] + (TEAL[2] - TEAL_DARK[2]) * t)
        ux = px / size * 108
        uy = py / size * 108
        for bx, by, bw, bh, color in blocks:
            margin = max(0.8, size / 96)
            if bx - margin <= ux <= bx + bw + margin and by - margin <= uy <= by + bh + margin:
                if bx <= ux <= bx + bw and by <= uy <= by + bh:
                    shade = 1.0 if (ux < bx + bw - 2 and uy < by + bh - 2) else 0.86
                    r, g, b = (int(c * shade) for c in color)
        return bytes((r, g, b, 255))

    return png_bytes(size, size, pixel)


def adaptive_vector() -> str:
    blocks = [
        ("#5EEAD4", "M36,38 h30 a2,2 0 0 1 2,2 v6 a2,2 0 0 1 -2,2 h-30 a2,2 0 0 1 -2,-2 v-6 a2,2 0 0 1 2,-2 z"),
        ("#FACC15", "M54,38 h12 a2,2 0 0 1 2,2 v12 a2,2 0 0 1 -2,2 h-12 a2,2 0 0 1 -2,-2 v-12 a2,2 0 0 1 2,-2 z"),
        ("#FB7185", "M36,54 h12 a2,2 0 0 1 2,2 v12 a2,2 0 0 1 -2,2 h-12 a2,2 0 0 1 -2,-2 v-12 a2,2 0 0 1 2,-2 z"),
        ("#FFF7D6", "M54,54 h12 a2,2 0 0 1 2,2 v12 a2,2 0 0 1 -2,2 h-12 a2,2 0 0 1 -2,-2 v-12 a2,2 0 0 1 2,-2 z"),
    ]
    paths = "\n".join(
        f'    <path android:fillColor="{color}" android:pathData="{data}" />'
        for color, data in blocks
    )
    return f"""<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
{paths}
</vector>
"""


def main() -> None:
    for folder, size in SIZES.items():
        directory = os.path.join(ROOT, f"mipmap-{folder}")
        os.makedirs(directory, exist_ok=True)
        with open(os.path.join(directory, "ic_launcher.png"), "wb") as handle:
            handle.write(render_icon(size, round_icon=False))
        with open(os.path.join(directory, "ic_launcher_round.png"), "wb") as handle:
            handle.write(render_icon(size, round_icon=True))
        print(f"wrote mipmap-{folder} ({size}px)")

    anydpi = os.path.join(ROOT, "mipmap-anydpi-v26")
    os.makedirs(anydpi, exist_ok=True)
    for name in ("ic_launcher", "ic_launcher_round"):
        with open(os.path.join(anydpi, f"{name}.xml"), "w", encoding="utf-8") as handle:
            handle.write(
                '<?xml version="1.0" encoding="utf-8"?>\n'
                '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                '    <background android:drawable="@color/ic_launcher_background" />\n'
                '    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n'
                '</adaptive-icon>\n'
            )
    drawable = os.path.join(ROOT, "drawable")
    os.makedirs(drawable, exist_ok=True)
    with open(os.path.join(drawable, "ic_launcher_foreground.xml"), "w", encoding="utf-8") as handle:
        handle.write(adaptive_vector())
    print("wrote adaptive icon resources")


if __name__ == "__main__":
    main()
