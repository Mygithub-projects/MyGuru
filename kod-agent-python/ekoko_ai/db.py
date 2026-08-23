"""Capaian Postgres — baca sahaja. Skema dimiliki oleh Prisma dalam ekokot6.
Postgres access — read only. The schema is owned by Prisma over in ekokot6."""

from __future__ import annotations

from typing import Any

import psycopg
from psycopg.rows import dict_row

# Nama jadual & lajur Prisma menggunakan camelCase, jadi setiap pengenal
# mesti dipetik dua kali dalam SQL — tanpa petikan Postgres akan huruf-kecilkan.


def sambung(database_url: str) -> psycopg.Connection:
    """Buka sambungan yang memulangkan baris sebagai dict.
    Open a connection that returns rows as dicts."""
    return psycopg.connect(database_url, row_factory=dict_row)


def senarai_pelajar(conn: psycopg.Connection, had: int = 10) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT "noIc", nama, "kelasT6", "markahPajskT6", "gredPajskT6"
            FROM "Pelajar"
            ORDER BY "kelasT6" NULLS LAST, nama
            LIMIT %s
            """,
            (had,),
        )
        return cur.fetchall()


def pelajar_ikut_ic(conn: psycopg.Connection, no_ic: str) -> dict[str, Any] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, "noIc", nama, "kelasT6", jantina,
                   "markahPajskT6", "peratusPajskT6", "gredPajskT6",
                   "markahKehadiran", "markahPenglibatan", "markahPencapaian",
                   "markahProjekJawatan", "markahProjekPeringkat", "markahEkstra"
            FROM "Pelajar"
            WHERE "noIc" = %s
            """,
            (no_ic,),
        )
        return cur.fetchone()


def koko_pelajar(conn: psycopg.Connection, pelajar_id: str) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT "jenisKoko",
                   "namaUnitT6", "jawatanT6", "peringkatT6",
                   "namaUnitT5", "jawatanT5", "peringkatT5"
            FROM "Kokurikulum"
            WHERE "pelajarId" = %s
            ORDER BY "jenisKoko"
            """,
            (pelajar_id,),
        )
        return cur.fetchall()


def kiraan(conn: psycopg.Connection) -> dict[str, int]:
    """Kiraan ringkas untuk semakan kesihatan.
    Row counts for a quick health check."""
    hasil: dict[str, int] = {}
    with conn.cursor() as cur:
        for jadual in ("Pelajar", "Guru", "Kokurikulum"):
            cur.execute(f'SELECT count(*) AS n FROM "{jadual}"')  # noqa: S608 - senarai tetap
            hasil[jadual] = cur.fetchone()["n"]
    return hasil
