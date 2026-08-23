"""Jana cerapan PAJSK untuk seorang pelajar.
Generate a PAJSK insight for one student."""

from __future__ import annotations

from typing import Any

from . import claude, db
from .config import Tetapan


def _baris_koko(koko: list[dict[str, Any]]) -> str:
    if not koko:
        return "  (tiada rekod kokurikulum)"
    baris = []
    for k in koko:
        t6 = " / ".join(x for x in (k["namaUnitT6"], k["jawatanT6"], k["peringkatT6"]) if x) or "-"
        t5 = " / ".join(x for x in (k["namaUnitT5"], k["jawatanT5"], k["peringkatT5"]) if x) or "-"
        baris.append(f"  {k['jenisKoko']:8} T6: {t6}\n           T5: {t5}")
    return "\n".join(baris)


def bina_prompt(pelajar: dict[str, Any], koko: list[dict[str, Any]]) -> str:
    """Susun data pelajar menjadi prompt. Diasingkan supaya boleh diuji tanpa API.
    Assemble student data into a prompt. Separated so it is testable without the API."""
    return f"""Berikan cerapan ringkas (3-4 ayat) tentang prestasi kokurikulum pelajar ini.
Sebut satu kekuatan dan satu ruang penambahbaikan yang konkrit.

Nama            : {pelajar['nama']}
Kelas           : {pelajar['kelasT6'] or '-'}
Markah PAJSK T6 : {pelajar['markahPajskT6'] if pelajar['markahPajskT6'] is not None else '-'}
Gred            : {pelajar['gredPajskT6'] or '-'}

Komponen markah:
  Kehadiran        : {pelajar['markahKehadiran']} / 50
  Penglibatan      : {pelajar['markahPenglibatan']} / 10
  Pencapaian       : {pelajar['markahPencapaian']} / 10
  Projek Jawatan   : {pelajar['markahProjekJawatan']} / 10
  Projek Peringkat : {pelajar['markahProjekPeringkat']} / 10
  Ekstra (bonus)   : {pelajar['markahEkstra']} / 10

Unit kokurikulum:
{_baris_koko(koko)}
"""


def jana(tetapan: Tetapan, no_ic: str) -> str:
    """Ambil data pelajar dari DB dan pulangkan cerapan daripada Claude.
    Fetch the student from the DB and return an insight from Claude."""
    with db.sambung(tetapan.database_url) as conn:
        pelajar = db.pelajar_ikut_ic(conn, no_ic)
        if pelajar is None:
            raise LookupError(f"Tiada pelajar dengan No. IC {no_ic!r}")
        koko = db.koko_pelajar(conn, pelajar["id"])

    cli = claude.klien(tetapan)
    return claude.tanya(tetapan, cli, bina_prompt(pelajar, koko))
