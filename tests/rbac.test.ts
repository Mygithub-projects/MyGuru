import { describe, it, expect } from "vitest";
import { bolehAksesUnit } from "../src/lib/workflow";

// §3 — Guru Penasihat hanya boleh akses/sahkan pelajar dalam kelab/sukan yang
// mereka diselia. Keputusan tulen (tanpa DB) diuji di sini; lapisan API
// membalut ini dan memulangkan 403 apabila false.

describe("RBAC §3 — bolehAksesUnit", () => {
  it("guru unit BOLEH akses pelajar dalam kelab seliaannya", () => {
    expect(
      bolehAksesUnit({
        seluruhSekolah: false,
        unitSeliaan: ["Kelab Komputer"],
        unitPelajar: ["Kelab Komputer", "Bola Sepak"],
      })
    ).toBe(true);
  });

  it("guru unit DITOLAK akses pelajar kelab lain (→ 403)", () => {
    expect(
      bolehAksesUnit({
        seluruhSekolah: false,
        unitSeliaan: ["Kelab Komputer"],
        unitPelajar: ["Kelab Robotik", "Ping Pong"],
      })
    ).toBe(false);
  });

  it("guru tanpa unit seliaan tiada akses", () => {
    expect(
      bolehAksesUnit({ seluruhSekolah: false, unitSeliaan: [], unitPelajar: ["Kelab Komputer"] })
    ).toBe(false);
  });

  it("pelajar tanpa unit tidak boleh diakses guru unit", () => {
    expect(
      bolehAksesUnit({ seluruhSekolah: false, unitSeliaan: ["Kelab Komputer"], unitPelajar: [] })
    ).toBe(false);
  });

  it("guru seluruh sekolah (Penyelaras/PemantauKUPP/PenolongSU) sentiasa boleh akses", () => {
    expect(
      bolehAksesUnit({ seluruhSekolah: true, unitSeliaan: [], unitPelajar: ["Kelab apa-apa"] })
    ).toBe(true);
  });

  it("guru menyelia BANYAK unit — akses jika pelajar dalam mana-mana satu", () => {
    expect(
      bolehAksesUnit({
        seluruhSekolah: false,
        unitSeliaan: ["Kelab Komputer", "Catur", "Silat"],
        unitPelajar: ["Silat"],
      })
    ).toBe(true);
  });
});

describe("Guru Pemantau (skop unit, lihat sahaja)", () => {
  it("tidak termasuk dalam skop seluruh sekolah", async () => {
    const { JAWATAN_GURU_SELURUH_SEKOLAH } = await import("../src/lib/enums");
    expect(JAWATAN_GURU_SELURUH_SEKOLAH).not.toContain("GuruPemantau");
  });
  it("teks 'Guru Pemantau' dipetakan ke GuruPemantau, bukan PemantauKUPP", async () => {
    const { mapJawatanGuru } = await import("../src/lib/jawatan-map");
    expect(mapJawatanGuru("Guru Pemantau")).toBe("GuruPemantau");
    expect(mapJawatanGuru("KUPP/Pemantau")).toBe("PemantauKUPP");
  });
});
