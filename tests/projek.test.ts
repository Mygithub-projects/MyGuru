import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/prisma", () => ({ prisma: {} }));
import type { LaporanProjek } from "@prisma/client";
import { gabungProjek, unitKredit } from "../src/lib/projek";

const laporan = (o: Partial<LaporanProjek> = {}): LaporanProjek => ({
  id: "L1", namaProjek: "Merentas Desa", jenisKoko: "Sukan", namaUnit: "Futsal", jawatanProjek: "Pengurus Projek",
  peringkatProjek: "Sekolah", tarikh: null, laporan: null, setiausahaId: "SU", failKertasKerja: null, failLaporanImpak: null,
  kewangan: null, kekuatan: null, kelemahan: null, statusPengesahan: "Approved", komenGuru: null, disahkanOleh: null,
  tarikhSahkan: null, createdAt: new Date(), updatedAt: new Date(), sesiId: null, projekId: "P1", ...o,
});

describe("unitKredit", () => {
  it("ambil unit peserta yang terlibat dalam projek", () => {
    expect(unitKredit(["Futsal", "Kelab Muzik"], ["Futsal", "Catur"])).toEqual(["Futsal"]);
  });
  it("jika tiada unit terlibat, semua unit peserta", () => {
    expect(unitKredit(["Kelab Muzik", "PISPA"], ["Futsal"])).toEqual(["Kelab Muzik", "PISPA"]);
  });
});

describe("gabungProjek", () => {
  it("rekod maya bagi setiap unit kredit dengan jawatan peserta", () => {
    const out = gabungProjek([], [
      { id: "x", laporanId: "L1", pelajarId: "A", jawatan: "Ahli", unitKredit: ["Kelab Muzik", "PISPA"], laporan: laporan() },
    ], [{ namaUnitT6: "Kelab Muzik", jenisKoko: "Kelab" }, { namaUnitT6: "PISPA", jenisKoko: "Uniform" }]);
    expect(out.map((r) => [r.namaUnit, r.jenisKoko, r.jawatanProjek, r.peringkatProjek])).toEqual([
      ["Kelab Muzik", "Kelab", "Ahli", "Sekolah"],
      ["PISPA", "Uniform", "Ahli", "Sekolah"],
    ]);
  });
  it("tidak gandakan laporan milik pelajar sendiri", () => {
    const l = laporan();
    const out = gabungProjek([l], [{ id: "x", laporanId: "L1", pelajarId: "SU", jawatan: "Ahli", unitKredit: ["Futsal"], laporan: l }]);
    expect(out).toHaveLength(1);
    expect(out[0].jawatanProjek).toBe("Pengurus Projek");
  });
});
