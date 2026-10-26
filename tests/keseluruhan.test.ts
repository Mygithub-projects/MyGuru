import { describe, it, expect } from "vitest";
import type { Kokurikulum, Pencapaian } from "@prisma/client";
import { kiraSkor, markahKehadiran, markahKeseluruhan, markahEkstra, perjumpaanPajsk } from "../src/lib/pajsk";
import { itemEkstra, skorUnit, type RekodPelajar } from "../src/lib/skor-unit";

const koko = (k: Partial<Kokurikulum>) =>
  ({ id: "k", pelajarId: "p", jenisKoko: "Kelab", namaUnitT6: null, jawatanT6: null, peringkatT6: null, ...k }) as Kokurikulum;
const kosong: RekodPelajar = { kehadiran: [], pencapaian: [], aktivitiLuar: [], laporanProjek: [] };

describe("markah keseluruhan — purata 2 bidang terbaik + ekstra", () => {
  it("contoh slip rasmi: [83, 80, 93] + 7 → 95", () => {
    expect(markahKeseluruhan([83, 80, 93], 7)).toBe(95);
  });
  it("tanpa Unit Perkhidmatan: purata 2 terbaik sahaja", () => {
    expect(markahKeseluruhan([83, 80, 93], 0)).toBe(88);
  });
  it("satu bidang sahaja: bidang kedua dikira 0", () => {
    expect(markahKeseluruhan([80], 0)).toBe(40);
    expect(markahKeseluruhan([], 0)).toBe(0);
  });
  it("had 100 & ekstra maks 10", () => {
    expect(markahKeseluruhan([98, 96], 10)).toBe(100);
    expect(markahKeseluruhan([50, 50], 25)).toBe(60);
  });
  it("purata dibundar biasa 2dp", () => {
    expect(markahKeseluruhan([83.33, 80], 0)).toBe(81.67);
  });
  it("contoh panduan KPM: (94 + 76.67) / 2 = 85.34, + 6 = 91.34", () => {
    expect(markahKeseluruhan([75.33, 94, 76.67], 6)).toBe(91.34);
  });
});

describe("ekstra kurikulum — jawatan Unit Perkhidmatan + anugerah khas", () => {
  it("jawatan UP sahaja memberi markah ekstra", () => {
    const k = [koko({ jenisKoko: "Perkhidmatan", namaUnitT6: "Unit Sidang Redaksi", jawatanT6: "Setiausaha" })];
    expect(markahEkstra(itemEkstra(kosong, k))).toBe(5);
  });
  it("ambil MAX antara jawatan UP & anugerah khas", () => {
    const k = [koko({ jenisKoko: "Perkhidmatan", namaUnitT6: "Unit Sidang Redaksi", jawatanT6: "Setiausaha" })];
    const rekod = { ...kosong, pencapaian: [{ kategori: "ekstra", namaPencapaian: "ARP Emas" } as Pencapaian] };
    expect(markahEkstra(itemEkstra(rekod, k))).toBe(10);
  });
  it("tiada UP & tiada anugerah → 0", () => {
    expect(markahEkstra(itemEkstra(kosong, [koko({ namaUnitT6: "Kelab Falak" })]))).toBe(0);
  });
});

describe("skorUnit — skor satu bidang /100", () => {
  it("kehadiran bidang itu sahaja + jawatan + penglibatan", () => {
    const rekod = { ...kosong, kehadiran: [...Array(30)].map(() => ({ jenisKoko: "Kelab" })).concat([{ jenisKoko: "Sukan" }]) };
    const s = skorUnit(rekod, koko({ namaUnitT6: "Kelab Falak", jawatanT6: "Pengerusi", peringkatT6: "Kebangsaan" }));
    expect(s.hadir).toBe(30);
    expect(s.mKehadiran).toBe(50);
    expect(s.jumlah).toBe(50 + s.mJawatan + 10);
  });
  it("Unit Perkhidmatan tiada jumlah /100 (ekstra sahaja)", () => {
    const s = skorUnit(kosong, koko({ jenisKoko: "Perkhidmatan", namaUnitT6: "Unit Pusat Sumber", jawatanT6: "Bendahari" }));
    expect(s.jumlah).toBeNull();
    expect(s.mJawatan).toBe(5);
  });
});

// Jumlah lajur dalam contoh panduan KPM tidak sepadan dengan komponennya
// (Kelab tulis 75.33, Beruniform 94, Sukan 76.67). Sistem menjumlahkan komponen.
describe("contoh pengiraan panduan KPM — jumlah komponen sebenar", () => {
  it("Kelab: 43.33+8+6+4+6+6 = 73.33 (panduan tulis 75.33)", () => {
    const s = kiraSkor({ markahKehadiran: 43.33, markahJawatan: 8, markahPenglibatan: 6, markahPencapaian: 4, markahProjekJawatan: 6, markahProjekPeringkat: 6 });
    expect(s.jumlahTeras).toBe(73.33);
  });
  it("Beruniform: 50+10+8+8+8+8 = 92 (panduan tulis 94)", () => {
    const s = kiraSkor({ markahKehadiran: 50, markahJawatan: 10, markahPenglibatan: 8, markahPencapaian: 8, markahProjekJawatan: 8, markahProjekPeringkat: 8 });
    expect(s.jumlahTeras).toBe(92);
  });
  it("Sukan: 46.67+6+6+5+10+4 = 77.67 (panduan tulis 76.67)", () => {
    const s = kiraSkor({ markahKehadiran: 46.67, markahJawatan: 6, markahPenglibatan: 6, markahPencapaian: 5, markahProjekJawatan: 10, markahProjekPeringkat: 4 });
    expect(s.jumlahTeras).toBe(77.67);
  });
  it("dengan jumlah sebenar: (92 + 77.67) / 2 = 84.84 (84.835), + 6 = 90.84", () => {
    expect(markahKeseluruhan([73.33, 92, 77.67], 6)).toBe(90.84);
  });
});

describe("kehadiran GABUNGAN KP + SP + BU, maks 15 perjumpaan (KPM)", () => {
  it("contoh: tetapan 16 + 17 + 14 = 47, hadir 44 → 22 → had 15 → 50", () => {
    expect(perjumpaanPajsk(44, 47)).toBe(15);
    expect(markahKehadiran(44, 47)).toBe(50);
  });
  it("hadir 20 daripada 47 → 10 perjumpaan → 33.33", () => {
    expect(markahKehadiran(20, 47)).toBe(33.33);
  });
  it("hadir dihadkan pada jumlah tetapan", () => {
    expect(perjumpaanPajsk(60, 20)).toBe(10);
  });
  it("lalai 30 kekal sama seperti panduan (29 → 14 → 46.67)", () => {
    expect(markahKehadiran(29)).toBe(46.67);
    expect(markahKehadiran(30)).toBe(50);
  });
  it("skorUnit: markah kehadiran sama dalam setiap bidang (gabungan)", () => {
    const rekod = {
      ...kosong,
      kehadiran: [
        ...[...Array(16)].map(() => ({ jenisKoko: "Kelab" })),
        ...[...Array(15)].map(() => ({ jenisKoko: "Sukan" })),
        ...[...Array(13)].map(() => ({ jenisKoko: "Uniform" })),
      ],
    };
    const kp = skorUnit(rekod, koko({ namaUnitT6: "Kelab Muzik" }), { bidang: 16, gabung: 47 });
    const bu = skorUnit(rekod, koko({ jenisKoko: "Uniform", namaUnitT6: "PISPA" }), { bidang: 14, gabung: 47 });
    expect(kp.hadir).toBe(16);
    expect(bu.hadir).toBe(13);
    expect(kp.hadirGabung).toBe(44);
    expect(kp.perjumpaan).toBe(15);
    expect(kp.mKehadiran).toBe(50);
    expect(bu.mKehadiran).toBe(50);
  });
});
