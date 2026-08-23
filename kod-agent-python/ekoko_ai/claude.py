"""Pembalut nipis untuk Anthropic SDK.
Thin wrapper around the Anthropic SDK."""

from __future__ import annotations

import anthropic

from .config import Tetapan

ARAHAN_SISTEM = (
    "Anda pembantu analitik kokurikulum untuk sekolah Tingkatan 6 di Malaysia. "
    "Jawab dalam Bahasa Melayu yang ringkas dan padat. "
    "Berpandukan HANYA data yang diberikan — jangan reka nombor, nama unit, "
    "atau pencapaian yang tiada dalam data. Jika sesuatu maklumat tidak ada, "
    "sebut ia tidak tersedia."
)


class RalatClaude(RuntimeError):
    """Kegagalan panggilan Claude yang boleh dibaca pengguna.
    A user-readable failure from a Claude call."""


def klien(tetapan: Tetapan) -> anthropic.Anthropic:
    # api_key=None membiarkan SDK mencari ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
    # atau profil `ant auth login` mengikut susunan keutamaannya sendiri.
    #
    return anthropic.Anthropic(api_key=tetapan.anthropic_api_key)


def tanya(tetapan: Tetapan, cli: anthropic.Anthropic, prompt: str) -> str:
    """Hantar satu prompt dan pulangkan teks jawapan.
    Send one prompt and return the answer text."""
    try:
        respons = cli.beta.messages.create(
            model=tetapan.ai_model,
            max_tokens=16000,
            system=ARAHAN_SISTEM,
            thinking={"type": "adaptive"},
            output_config={"effort": tetapan.ai_effort},
            # Fallback sisi-pelayan: jika pengelas keselamatan menolak permintaan,
            # API mengalihkannya ke model lain mengikut kategori penolakan.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": prompt}],
        )
    except TypeError as e:
        # Tiada kelayakan langsung: SDK gagal semasa membina pengepala
        # permintaan (_validate_headers), bukan dengan AuthenticationError.
        if "authentication" not in str(e).lower():
            raise
        raise RalatClaude(
            "Tiada kelayakan Anthropic dijumpai. Tetapkan ANTHROPIC_API_KEY "
            "dalam .env, atau jalankan `ant auth login`."
        ) from e
    except anthropic.AuthenticationError as e:
        raise RalatClaude(
            "Kelayakan Anthropic tidak sah atau tiada. Tetapkan ANTHROPIC_API_KEY "
            "dalam .env, atau jalankan `ant auth login`."
        ) from e
    except anthropic.NotFoundError as e:
        raise RalatClaude(f"Model tidak dijumpai: {tetapan.ai_model!r}") from e
    except anthropic.RateLimitError as e:
        tunggu = e.response.headers.get("retry-after", "60")
        raise RalatClaude(f"Had kadar dicapai. Cuba semula selepas {tunggu}s.") from e
    except anthropic.APIStatusError as e:
        raise RalatClaude(f"Ralat API ({e.status_code}): {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise RalatClaude("Gagal menyambung ke API Anthropic. Semak rangkaian.") from e

    # Penolakan datang sebagai HTTP 200 — mesti disemak sebelum membaca content.
    if respons.stop_reason == "refusal":
        kategori = getattr(respons.stop_details, "category", None)
        raise RalatClaude(f"Permintaan ditolak oleh pengelas keselamatan (kategori: {kategori}).")

    teks = "".join(b.text for b in respons.content if b.type == "text").strip()
    if not teks:
        raise RalatClaude(f"Respons kosong (stop_reason={respons.stop_reason}).")
    return teks
