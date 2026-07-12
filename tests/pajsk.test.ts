import { describe, it, expect } from "vitest";
import {
  floorTo,
  peratusKehadiran,
  markahKehadiran,
  markahJawatan,
  markahPenglibatan,
  markahPencapaian,
  markahProjekJawatan,
  markahProjekPeringkat,
  nilaiEkstra,
  markahEkstra,
  gred,
  kiraSkor,
  petikMarkahKurungan,
  jumlahMarkahKurungan,
  huraiKehadiran,
  buangKurungan,
  normalizePeringkat,
  normalizeKedudukan,
  markahPeringkat,
  statusPilihanT6,
  delta,
} from "../src/lib/pajsk";

describe("pembundar FLOOR (§1.2 — sentiasa ke bawah)", () => {
  it("floorTo 2dp membuang perpuluhan lebihan (tidak membundar ke atas)", () => {
    expect(floorTo(76.666, 2)).toBe(76.66);
    expect(floorTo(38.335, 2)).toBe(38.33); // bukan 38.34
    expect(floorTo(99.999, 2)).toBe(99.99);
    expect(floorTo(50, 2)).toBe(50);
  });
});

describe("§1.2 Kehadiran — 50 markah, bundar ke bawah, atas 30 perjumpaan", () => {
  it("peratus kehadiran floor 2dp", () => {
    expect(peratusKehadiran(23, 30)).toBe(76.66); // 76.666.. → 76.66
    expect(peratusKehadiran(30, 30)).toBe(100);
    expect(peratusKehadiran(0, 30)).toBe(0);
  });
  it("contoh rasmi: 23/30 → 38.33 (bukan 38.34)", () => {
    expect(markahKehadiran(23, 30)).toBe(38.33);
  });
  it("30/30 = 50 (penuh)", () => expect(markahKehadiran(30)).toBe(50));
  it("15/30 = 25 (separuh)", () => expect(markahKehadiran(15)).toBe(25));
  it("0/30 = 0", () => expect(markahKehadiran(0)).toBe(0));
  it("kehadiran melebihi 30 dihadkan pada 50 (kes tepi hadir > 30)", () => {
    expect(markahKehadiran(35, 30)).toBe(50);
    expect(markahKehadiran(40, 30)).toBe(50);
  });
  it("29/30 → 48.33 (bundar ke bawah)", () => expect(markahKehadiran(29, 30)).toBe(48.33));
});

describe("§1.3 Jawatan — dua jadual (Uniform vs Kelab/Sukan)", () => {
  it("(b) Kelab/Sukan", () => {
    expect(markahJawatan("Pengerusi", "KelabSukan")).toBe(10);
    expect(markahJawatan("Naib Pengerusi", "KelabSukan")).toBe(8);
    expect(markahJawatan("Setiausaha", "KelabSukan")).toBe(7);
    expect(markahJawatan("Penolong Setiausaha", "KelabSukan")).toBe(6);
    expect(markahJawatan("Ahli Jawatankuasa", "KelabSukan")).toBe(5);
    expect(markahJawatan("Ahli Aktif", "KelabSukan")).toBe(4);
    expect(markahJawatan("Ahli Biasa", "KelabSukan")).toBe(2);
  });
  it("(a) Uniform", () => {
    expect(markahJawatan("Pengerusi", "Uniform")).toBe(10);
    expect(markahJawatan("Sarjan Mejar", "Uniform")).toBe(8);
    expect(markahJawatan("Setiausaha", "Uniform")).toBe(7);
    expect(markahJawatan("Koperal", "Uniform")).toBe(5);
    expect(markahJawatan("AJK", "Uniform")).toBe(4);
    expect(markahJawatan("Ahli Biasa", "Uniform")).toBe(2);
  });
  it("jadual dipilih dari jenisKoko (Sukan/Kelab → b, Uniform → a)", () => {
    expect(markahJawatan("Setiausaha", "Sukan")).toBe(7);
    expect(markahJawatan("Setiausaha", "Kelab")).toBe(7);
  });
  it("guna nilai dalam kurungan jika ada (keserasian import lama)", () => {
    expect(markahJawatan("BENDAHARI (6)")).toBe(6);
  });
  it("kes tepi: jawatan tak dikenali → 0", () => {
    expect(markahJawatan("Entah Apa", "KelabSukan")).toBe(0);
    expect(markahJawatan("", "Uniform")).toBe(0);
    expect(markahJawatan(null)).toBe(0);
  });
});

describe("§1.4 Penglibatan — 10 markah ikut peringkat", () => {
  it("skala peringkat", () => {
    expect(markahPenglibatan("Kebangsaan")).toBe(10);
    expect(markahPenglibatan("Antarabangsa")).toBe(10);
    expect(markahPenglibatan("Negeri")).toBe(8);
    expect(markahPenglibatan("Daerah")).toBe(6);
    expect(markahPenglibatan("Zon/Daerah")).toBe(6);
    expect(markahPenglibatan("Sekolah")).toBe(4);
  });
  it("kes tepi: peringkat tak dikenali → 0", () => {
    expect(markahPenglibatan("Alam Semesta")).toBe(0);
    expect(markahPenglibatan(null)).toBe(0);
  });
});

describe("§1.5 Pencapaian — 10 markah (peringkat × kedudukan)", () => {
  it("matriks penuh", () => {
    expect(markahPencapaian("Kebangsaan", "Johan")).toBe(10);
    expect(markahPencapaian("Kebangsaan", "Naib Johan")).toBe(9);
    expect(markahPencapaian("Kebangsaan", "Ketiga")).toBe(8);
    expect(markahPencapaian("Negeri", "Johan")).toBe(8);
    expect(markahPencapaian("Negeri", "Ketiga")).toBe(6);
    expect(markahPencapaian("Daerah", "Naib Johan")).toBe(5);
    expect(markahPencapaian("Sekolah", "Johan")).toBe(4);
    expect(markahPencapaian("Sekolah", "Ketiga")).toBe(2);
  });
  it("kedudukan dikesan dari teks (Juara/Emas/Tempat Ke-2)", () => {
    expect(markahPencapaian("Negeri", "Juara Piala")).toBe(8);
    expect(markahPencapaian("Negeri", "Tempat Ke-2")).toBe(7);
  });
  it("kes tepi: kedudukan / peringkat tak dikenali → 0", () => {
    expect(markahPencapaian("Negeri", "Penyertaan")).toBe(0);
    expect(markahPencapaian("Negeri", null)).toBe(0);
    expect(markahPencapaian("Alam Semesta", "Johan")).toBe(0);
  });
});

describe("§1.6 Projek (Jawatan) — 10 markah", () => {
  it("jadual", () => {
    expect(markahProjekJawatan("Pengerusi Projek")).toBe(10);
    expect(markahProjekJawatan("Pengurus Projek")).toBe(10);
    expect(markahProjekJawatan("Setiausaha Projek")).toBe(9);
    expect(markahProjekJawatan("Timbalan Pengerusi")).toBe(9);
    expect(markahProjekJawatan("Bendahari Projek")).toBe(8);
    expect(markahProjekJawatan("Penolong Setiausaha")).toBe(7);
    expect(markahProjekJawatan("Ahli Jawatankuasa Projek")).toBe(6);
    expect(markahProjekJawatan("Ahli")).toBe(5);
  });
  it("kes tepi: tak dikenali → 0", () => expect(markahProjekJawatan("xyz")).toBe(0));
});

describe("§1.7 Projek (Peringkat) — 10 markah", () => {
  it("jadual", () => {
    expect(markahProjekPeringkat("Negeri")).toBe(10);
    expect(markahProjekPeringkat("Kebangsaan")).toBe(10);
    expect(markahProjekPeringkat("Daerah")).toBe(8);
    expect(markahProjekPeringkat("Komuniti")).toBe(8);
    expect(markahProjekPeringkat("Sekolah")).toBe(6);
  });
  it("kes tepi: tak dikenali → 0", () => expect(markahProjekPeringkat("xyz")).toBe(0));
});

describe("§1.8 Ekstra Kurikulum — bonus 10, MAX antara (a) & (b)", () => {
  it("(a) Perkhidmatan", () => {
    expect(nilaiEkstra("Ketua Murid")).toBe(10);
    expect(nilaiEkstra("Pengawas")).toBe(7);
    expect(nilaiEkstra("Ketua Kelas")).toBe(5);
  });
  it("(b) Anugerah Khas", () => {
    expect(nilaiEkstra("ARP Emas")).toBe(10);
    expect(nilaiEkstra("ARP Perak")).toBe(7);
    expect(nilaiEkstra("Pengakap Raja")).toBe(10);
    expect(nilaiEkstra("Anugerah Khas Sukan — Negeri")).toBe(4);
  });
  it("MAX merentas item (a) & (b)", () => {
    expect(markahEkstra(["Pengawas", "ARP Emas"])).toBe(10);
    expect(markahEkstra(["Ketua Kelas"])).toBe(5);
    expect(markahEkstra([])).toBe(0);
    expect(markahEkstra([null, undefined, "xyz"])).toBe(0);
  });
});

describe("§1.9 Gred", () => {
  it("sempadan julat", () => {
    expect(gred(100)).toBe("A");
    expect(gred(80)).toBe("A");
    expect(gred(79.9)).toBe("B");
    expect(gred(60)).toBe("B");
    expect(gred(59.9)).toBe("C");
    expect(gred(40)).toBe("C");
    expect(gred(39.9)).toBe("D");
    expect(gred(20)).toBe("D");
    expect(gred(19.9)).toBe("E");
    expect(gred(0)).toBe("E");
  });
});

describe("kiraSkor — model 100 markah + bonus ekstra (§1.1)", () => {
  it("markah penuh semua komponen → 100, gred A", () => {
    const s = kiraSkor({
      markahKehadiran: 50,
      markahJawatan: 10,
      markahPenglibatan: 10,
      markahPencapaian: 10,
      markahProjekJawatan: 10,
      markahProjekPeringkat: 10,
      markahEkstra: 10,
    });
    expect(s.jumlahTeras).toBe(100);
    expect(s.peratus).toBe(100);
    expect(s.gred).toBe("A");
    expect(s.jumlahDenganBonus).toBe(110);
  });
  it("gabungan separa (kehadiran floor) + gred C", () => {
    const s = kiraSkor({
      markahKehadiran: 38.33,
      markahJawatan: 7,
      markahPenglibatan: 8,
      markahPencapaian: 6,
      markahEkstra: 5,
    });
    expect(s.jumlahTeras).toBe(59.33);
    expect(s.peratus).toBe(59.33);
    expect(s.gred).toBe("C");
    expect(s.jumlahDenganBonus).toBe(64.33);
  });
  it("komponen melebihi had dihadkan (kehadiran ≤50, lain ≤10)", () => {
    const s = kiraSkor({ markahKehadiran: 60, markahJawatan: 15 });
    expect(s.kehadiran).toBe(50);
    expect(s.jawatan).toBe(10);
  });
});

describe("penghurai kurungan (kekal untuk import lama)", () => {
  it("petik & jumlah dalam kurungan", () => {
    expect(petikMarkahKurungan("NEGERI (14)")).toBe(14);
    expect(petikMarkahKurungan("tiada nombor")).toBeNull();
    expect(jumlahMarkahKurungan("A (2), B (3)")).toBe(5);
  });
  it("hurai kehadiran & buang kurungan", () => {
    expect(huraiKehadiran("12 (40)")).toEqual({ hadir: 12, markahFail: 40 });
    expect(buangKurungan("SILAT (SR)")).toBe("SILAT");
  });
  it("normalize peringkat & kedudukan", () => {
    expect(normalizePeringkat("KEBANGSAAN (15)")).toBe("Kebangsaan");
    expect(normalizePeringkat("entah")).toBeNull();
    expect(normalizeKedudukan("Naib Johan")).toBe("Naib Johan");
    expect(normalizeKedudukan("Tempat Ketiga")).toBe("Ketiga");
    expect(normalizeKedudukan("hadir sahaja")).toBeNull();
  });
  it("markahPeringkat kompat = penglibatan / kurungan", () => {
    expect(markahPeringkat("Negeri")).toBe(8);
    expect(markahPeringkat("NEGERI (14)")).toBe(14);
  });
});

describe("utiliti & status pilihan unit", () => {
  it("delta", () => {
    expect(delta(77, 82)).toBe(5);
    expect(delta(null, 5)).toBeNull();
  });
  it("statusPilihanT6 (T6-only, tiada rujukan T5 dipapar)", () => {
    expect(statusPilihanT6({ namaUnitT6: null })).toBe("Belum Pilih");
    expect(statusPilihanT6({ namaUnitT6: "X", statusPertukaran: "Pending" })).toBe("Mohon Tukar");
    expect(statusPilihanT6({ namaUnitT6: "X", statusPertukaran: "Approved" })).toBe("Disahkan");
    expect(statusPilihanT6({ namaUnitT5: "SILAT", namaUnitT6: "SILAT", statusPertukaran: "None" })).toBe(
      "Kekal"
    );
  });
});
