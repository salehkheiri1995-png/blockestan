"""Synthesizes the small original UI sounds bundled with Blockestan.

The sounds are generated from sine waves with simple envelopes, so the project ships no
third-party audio assets and every byte is reproducible from this script.

Usage: python tools/generate_sounds.py
"""
from __future__ import annotations

import math
import os
import struct
import wave

RATE = 22050
OUT = os.path.join("app", "src", "main", "res", "raw")


def tone(freq: float, duration: float, volume: float = 0.45, sweep: float = 1.0,
         harmonics: tuple[float, ...] = (1.0,)) -> list[float]:
    frames = int(RATE * duration)
    samples: list[float] = []
    phase = 0.0
    for i in range(frames):
        t = i / max(1, frames - 1)
        f = freq * (sweep ** t)
        phase += 2.0 * math.pi * f / RATE
        sample = sum(h * math.sin(phase * (k + 1)) for k, h in enumerate(harmonics))
        # Fast attack, smooth exponential decay; avoids clicks at both ends.
        attack = min(1.0, i / (RATE * 0.008))
        decay = math.exp(-4.5 * t)
        samples.append(sample * volume * attack * decay)
    return samples


def silence(duration: float) -> list[float]:
    return [0.0] * int(RATE * duration)


def write_wav(name: str, samples: list[float]) -> None:
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        frames = b"".join(
            struct.pack("<h", max(-32767, min(32767, int(sample * 32767))))
            for sample in samples
        )
        handle.writeframes(frames)
    print(f"wrote {path} ({len(samples) / RATE:.2f}s)")


def main() -> None:
    write_wav("place.wav", tone(660, 0.09, 0.5, 0.82, (1.0, 0.35)))
    write_wav(
        "clear.wav",
        tone(523.25, 0.10, 0.4)
        + tone(659.25, 0.10, 0.4)
        + tone(783.99, 0.16, 0.45),
    )
    write_wav("invalid.wav", tone(150, 0.13, 0.35, 0.9, (1.0, 0.5, 0.25)))
    write_wav(
        "coin.wav",
        tone(900, 0.07, 0.4, 1.4, (1.0, 0.2)) + tone(1300, 0.09, 0.35, 1.1),
    )
    write_wav(
        "win.wav",
        tone(523.25, 0.12, 0.4)
        + tone(659.25, 0.12, 0.4)
        + tone(783.99, 0.12, 0.4)
        + tone(1046.5, 0.30, 0.45)
        + silence(0.05),
    )


if __name__ == "__main__":
    main()
