import { describe, it, expect } from "vitest";
import type { Kokurikulum } from "@prisma/client";
import { markahPeserta, penglibatanAktivitiUnit, pencapaianAktivitiUnit } from "../src/lib/aktiviti-unit-markah";
import { skorUnit, type RekodPelajar } from "../src/lib/skor-unit";

const koko = (k: Partial<Kokurikulum>) =>
  ({ id: "k", pelajarId: "p", jenisKoko: "Kelab", namaUnitT6: null, jawatanT6: null, peringkatT6: null, ...k }) as Kokurikulum;

describe("Aktiviti Unit — Jadual D (penglibatan) & E (pencapaian)", () => {
  it("penglibatan ikut peringkat: Kebangsaan 10, Negeri 8, Daerah 6, Sekolah 4", () => {
    expect(markahPeserta("Kebangsaan", "Penyertaan").penglibatan).toBe(10);
    expect(markahPeserta("Negeri", "Penyertaan").penglibatan).toBe(8);
    expect(markahPeserta("Daerah", "Penyertaan").penglibatan).toBe(6);
    expect(markahPeserta("Sekolah", "Penyertaan").penglibatan).toBe(4);
  });
  it("pencapaian ikut peringkat × kedudukan (Jadual E)", () => {
    const jadual: [string, number, number, number][] = [
      ["Kebangsaan", 10, 9, 8], ["Negeri", 8, 7, 6], ["Daerah", 6, 5, 4], ["Sekolah", 4, 3, 2],
    ];
    for (const [p, j, nj, k3] of jadual) {
      expect(markahPeserta(p, "Johan").pencapaian).toBe(j);
      expect(markahPeserta(p, "Naib Johan").pencapaian).toBe(nj);
      expect(markahPeserta(p, "Ketiga").pencapaian).toBe(k3);
      expect(markahPeserta(p, "Penyertaan").pencapaian).toBe(0);
    }
  });
});

describe("Aktiviti Unit — kredit ke unit peserta dalam bidang SAMA dengan aktiviti", () => {
  // Aktiviti Futsal (Sukan), peringkat Daerah, peserta Naib Johan.
  const baris = [{ kedudukan: "Naib Johan", aktiviti: { namaAktiviti: "Kejohanan Futsal", peringkat: "Daerah", jenisKoko: "Sukan" } }];
  const rekod: RekodPelajar = {
    kehadiran: [], pencapaian: [], aktivitiLuar: [], laporanProjek: [],
    programKolej: penglibatanAktivitiUnit(baris),
    pencapaianBidang: pencapaianAktivitiUnit(baris),
  };
  it("unit Sukan peserta (cth. Catur) menerima penglibatan 6 & pencapaian 5", () => {
    const s = skorUnit(rekod, koko({ jenisKoko: "Sukan", namaUnitT6: "Catur", peringkatT6: "Sekolah" }));
    expect(s.mPenglibatan).toBe(6);
    expect(s.pcpMarkah).toBe(5);
  });
  it("unit Kelab peserta TIDAK menerima kredit", () => {
    const s = skorUnit(rekod, koko({ jenisKoko: "Kelab", namaUnitT6: "Kelab Komputer", peringkatT6: "Sekolah" }));
    expect(s.mPenglibatan).toBe(4);
    expect(s.pcpMarkah).toBe(0);
  });
  it("penglibatan unit tidak turun jika peringkat unit lebih tinggi", () => {
    const s = skorUnit(rekod, koko({ jenisKoko: "Sukan", namaUnitT6: "Catur", peringkatT6: "Negeri" }));
    expect(s.mPenglibatan).toBe(8);
  });
});

describe("Aktiviti Luar disahkan — penglibatan (Jadual D) & pencapaian unit berkaitan", () => {
  const luar = {
    namaAktiviti: "Kejohanan Catur Negeri", namaUnit: "Catur", peringkat: "Negeri",
    kedudukan: "Naib Johan", markahLuar: 7, markahPenglibatan: 8, markahPencapaian: 7,
  } as unknown as RekodPelajar["aktivitiLuar"][number];
  const rekod: RekodPelajar = { kehadiran: [], pencapaian: [], aktivitiLuar: [luar], laporanProjek: [] };
  it("unit Catur: penglibatan 8 (Negeri), pencapaian 7 (N.Johan Negeri)", () => {
    const s = skorUnit(rekod, koko({ jenisKoko: "Sukan", namaUnitT6: "Catur", peringkatT6: "Sekolah" }));
    expect(s.mPenglibatan).toBe(8);
    expect(s.pcpMarkah).toBe(7);
  });
  it("unit lain tidak menerima kredit", () => {
    const s = skorUnit(rekod, koko({ jenisKoko: "Kelab", namaUnitT6: "Kelab Komputer", peringkatT6: "Sekolah" }));
    expect(s.mPenglibatan).toBe(4);
    expect(s.pcpMarkah).toBe(0);
  });
});
