"""Konfigurasi servis, dibaca dari .env di akar folder ini.
Service configuration, loaded from .env at the root of this folder."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, field_validator

# Akar folder kod-agent-python/ — dua tingkat dari fail ini.
AKAR = Path(__file__).resolve().parent.parent

EFFORT_SAH = {"low", "medium", "high", "xhigh", "max"}


class Tetapan(BaseModel):
    """Nilai konfigurasi yang sudah disahkan.
    Validated configuration values."""

    anthropic_api_key: str | None = None
    ai_model: str = "claude-opus-5"
    ai_effort: str = "high"
    database_url: str
    data_dir: Path
    log_level: str = "INFO"

    @field_validator("ai_effort")
    @classmethod
    def _sahkan_effort(cls, v: str) -> str:
        if v not in EFFORT_SAH:
            raise ValueError(f"AI_EFFORT mesti salah satu daripada {sorted(EFFORT_SAH)}, dapat {v!r}")
        return v

    @field_validator("ai_model")
    @classmethod
    def _sahkan_model(cls, v: str) -> str:
        # ID model lengkap seadanya — akhiran tarikh akan ditolak API.
        if v and v[-1].isdigit() and v.count("-") >= 3 and v.split("-")[-1].isdigit() and len(v.split("-")[-1]) == 8:
            raise ValueError(f"Jangan tambah akhiran tarikh pada ID model: {v!r}")
        return v


def muat_tetapan() -> Tetapan:
    """Baca .env dan pulangkan Tetapan. Ralat jelas jika DATABASE_URL tiada.
    Read .env and return Tetapan. Fails loudly when DATABASE_URL is missing."""
    load_dotenv(AKAR / ".env")

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL tiada. Salin .env.example ke .env dan isi nilainya:\n"
            "  cp .env.example .env"
        )

    # DATA_DIR relatif kepada folder ini, bukan kepada cwd pemanggil.
    data_dir = (AKAR / os.getenv("DATA_DIR", "../../")).resolve()

    kunci = os.getenv("ANTHROPIC_API_KEY", "").strip()

    return Tetapan(
        anthropic_api_key=kunci or None,
        ai_model=os.getenv("AI_MODEL", "claude-opus-5").strip() or "claude-opus-5",
        ai_effort=os.getenv("AI_EFFORT", "high").strip() or "high",
        database_url=database_url,
        data_dir=data_dir,
        log_level=os.getenv("LOG_LEVEL", "INFO").strip() or "INFO",
    )
