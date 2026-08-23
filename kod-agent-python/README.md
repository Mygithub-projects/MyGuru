# Servis AI Python — e-KokoT6

Servis kecil yang membaca data PAJSK dari Postgres yang sama dengan `ekokot6`
dan menjana cerapan menggunakan Claude.

A small service that reads PAJSK data from the same Postgres as `ekokot6` and
generates insights using Claude.

## Sediakan / Setup

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux

cp .env.example .env      # kemudian isi nilainya / then fill in the values
```

Perlukan Python 3.10+ (`anthropic` 1.x menggugurkan sokongan 3.9).
Requires Python 3.10+ (`anthropic` 1.x drops 3.9 support).

## Perintah / Commands

```bash
python main.py semak                      # konfigurasi, fail sumber, kiraan DB
python main.py senarai --had 20           # senaraikan pelajar
python main.py cerapan --ic 123456789012  # cerapan PAJSK seorang pelajar
```

`semak` dan `senarai` **tidak** memanggil API Claude — guna kedua-duanya untuk
mengesahkan sambungan sebelum membelanjakan token.

`semak` and `senarai` make **no** Claude API call — use them to verify
connectivity before spending tokens.

## Struktur / Layout

| Fail | Tanggungjawab / Responsibility |
|---|---|
| `ekoko_ai/config.py` | Baca & sahkan `.env` / read & validate `.env` |
| `ekoko_ai/db.py`     | Pertanyaan Postgres, baca sahaja / read-only Postgres queries |
| `ekoko_ai/claude.py` | Pembalut Anthropic SDK / Anthropic SDK wrapper |
| `ekoko_ai/cerapan.py`| Bina prompt & jana cerapan / prompt building & insight generation |
| `main.py`            | CLI |

`cerapan.bina_prompt()` sengaja diasingkan daripada panggilan API supaya
susun atur prompt boleh diuji tanpa kunci dan tanpa kos.

`cerapan.bina_prompt()` is deliberately separate from the API call so the
prompt layout can be tested without a key and without cost.

## Nota / Notes

**Pangkalan data.** `.env.example` menunjuk ke stack Docker tempatan
(`localhost:5433` — lihat `../DOCKER.md`). Perhatian: `ekokot6/.env` menunjuk
ke pangkalan data **jauh** yang dikongsi. Sahkan sasaran sebelum menjalankan
apa-apa yang menulis. Modul `db.py` ini baca sahaja.

**Database.** `.env.example` points at the local Docker stack
(`localhost:5433` — see `../DOCKER.md`). Note that `ekokot6/.env` points at a
shared **remote** database. Verify your target before running anything that
writes. This `db.py` is read-only.

**Model.** Lalai `claude-opus-5` dengan pemikiran adaptif dan `effort` boleh
dilaraskan melalui `AI_EFFORT`. Fallback sisi-pelayan dihidupkan
(`fallbacks="default"`), jadi permintaan yang ditolak pengelas keselamatan
dialihkan ke model lain dan bukannya gagal terus.

**Model.** Defaults to `claude-opus-5` with adaptive thinking and `effort`
adjustable via `AI_EFFORT`. Server-side fallbacks are enabled
(`fallbacks="default"`), so a request refused by the safety classifier is
rerouted to another model instead of failing outright.

**Kelayakan.** `ANTHROPIC_API_KEY` boleh dikosongkan jika anda guna
`ant auth login` — SDK membaca profil itu sendiri.

**Credentials.** `ANTHROPIC_API_KEY` may be left empty if you use
`ant auth login` — the SDK reads that profile itself.
