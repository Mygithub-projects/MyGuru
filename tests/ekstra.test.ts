import { describe, it, expect } from "vitest";
import { nilaiEkstra } from "../src/lib/pajsk";
import { JAWATAN_PERKHIDMATAN } from "../src/lib/enums";

// Panduan Pentaksiran Kokurikulum T6 KPM — Ekstra Kurikulum (10 markah).

describe("Jadual 1: Jawatan Berasaskan Bidang Perkhidmatan", () => {
  const jadual1: [string, number][] = [
    ["Ketua Murid", 10], ["Pengerusi", 10],
    ["Penolong Ketua Murid", 8], ["Timbalan Pengerusi", 8],
    ["Pengurusan Utama", 7], ["Pengawas", 7], ["Ketua Asrama", 7], ["BADAR", 7], ["Ketua PRS", 7],
    ["Pengerusi Badan-Badan Perkhidmatan Sekolah", 7],
    ["Penolong Ketua Asrama", 6], ["Penolong BADAR", 6], ["Pengawas Pusat Sumber", 6],
    ["Ahli Lembaga Pengarah Koperasi Sekolah", 6],
    ["AJK Utama Badan-badan Perkhidmatan", 5], ["Bendahari", 5], ["Setiausaha", 5], ["Ketua Biro", 5],
    ["Pengawas Koperasi", 5], ["Ketua Kelas", 5], ["Ketua Tingkatan", 5], ["AJK", 5],
    ["AJK Kecil Biro", 3], ["Ketua Bilik", 3], ["Ketua Dorm", 3], ["Penolong Ketua Kelas", 3],
    ["Penolong Ketua Bilik", 3],
  ];
  it.each(jadual1)("%s → %i", (perkara, skor) => expect(nilaiEkstra(perkara)).toBe(skor));
});

describe("Jadual 2: Markah bagi Anugerah Khas", () => {
  const jadual2: [string, number][] = [
    ["ARP Emas", 10], ["ARP Perak", 7], ["ARP Gangsa", 5],
    ["Anugerah Khas Sukan Peringkat Kebangsaan", 5], ["Anugerah Khas Sukan Peringkat Negeri", 4],
    ["Anugerah Khas Sukan Peringkat Daerah", 3], ["Anugerah Khas Sukan Peringkat Sekolah", 2],
    ["Penyertaan Peringkat Antarabangsa Emas", 5], ["Penyertaan Peringkat Antarabangsa Perak", 4],
    ["Penyertaan Peringkat Antarabangsa Gangsa", 3], ["Penyertaan Peringkat Antarabangsa Penyertaan", 2],
    ["Pengakap Raja", 10], ["Pandu Puteri Raja", 10],
  ];
  it.each(jadual2)("%s → %i", (perkara, skor) => expect(nilaiEkstra(perkara)).toBe(skor));
});

describe("pilihan jawatan Unit Perkhidmatan (dropdown guru)", () => {
  it("setiap pilihan kecuali 'Ahli' memberi skor Jadual 1", () => {
    for (const j of JAWATAN_PERKHIDMATAN) {
      if (j === "Ahli") expect(nilaiEkstra(j)).toBe(0);
      else expect(nilaiEkstra(j), j).toBeGreaterThan(0);
    }
  });
  it("contoh panduan: ekstra 6 = Pengawas Pusat Sumber / Ahli Lembaga Pengarah Koperasi", () => {
    expect(nilaiEkstra("Pengawas Pusat Sumber")).toBe(6);
    expect(nilaiEkstra("Ahli Lembaga Pengarah Koperasi")).toBe(6);
  });
});

describe("Ekstra Kurikulum — markah pilihan Ketua Unit Koko", () => {
  it("perkara dipilih: markah kurungan diguna terus", async () => {
    const { teksEkstra } = await import("../src/lib/skor-unit");
    const { nilaiEkstra } = await import("../src/lib/pajsk");
    expect(nilaiEkstra(teksEkstra({ namaPencapaian: "Kejohanan X (2026)", perkaraEkstra: "ANUGERAH KHAS SUKAN (NEGERI)", markah: 4 }))).toBe(4);
    expect(nilaiEkstra(teksEkstra({ namaPencapaian: "x", perkaraEkstra: "PENGAKAP RAJA / PANDU PUTERI RAJA", markah: 10 }))).toBe(10);
  });
  it("rekod lama tanpa perkara: dipadan ikut nama", async () => {
    const { teksEkstra } = await import("../src/lib/skor-unit");
    const { nilaiEkstra } = await import("../src/lib/pajsk");
    expect(nilaiEkstra(teksEkstra({ namaPencapaian: "ARP EMAS", perkaraEkstra: null, markah: 0 }))).toBe(10);
  });
  it("senarai Anugerah Khas ikut dokumen (16 perkara, skor 2–10)", async () => {
    const { ANUGERAH_KHAS } = await import("../src/lib/enums");
    expect(ANUGERAH_KHAS).toHaveLength(16);
    expect(Math.max(...ANUGERAH_KHAS.map((a) => a.skor))).toBe(10);
    expect(Math.min(...ANUGERAH_KHAS.map((a) => a.skor))).toBe(2);
  });
});
