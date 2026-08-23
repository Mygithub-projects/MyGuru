import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { icToString, parsePajskWorksheet } from "../src/lib/import";
import { normalizeIC, isValidIC } from "../src/lib/auth-core";
import { mapJawatanGuru } from "../src/lib/jawatan-map";

describe("icToString — No. IC sebagai teks", () => {
  it("kembangkan format saintifik (punca utama pepijat Excel)", () => {
    // 7.31004025424E11 -> 731004025424 (bukan '7.31004025424e+11')
    expect(icToString(7.31004025424e11)).toBe("731004025424");
  });

  it("kekalkan rentetan IC 12-digit", () => {
    expect(icToString("080917074685")).toBe("080917074685");
  });

  it("buang sengkang/ruang", () => {
    expect(icToString("070118-14-0994")).toBe("070118140994");
    expect(icToString(" 080920 16 2205 ")).toBe("080920162205");
  });

  it("kendali objek rich-text ExcelJS", () => {
    expect(icToString({ text: "080917074685" })).toBe("080917074685");
  });

  it("kosong untuk null/undefined", () => {
    expect(icToString(null)).toBe("");
    expect(icToString(undefined)).toBe("");
  });
});

describe("validasi IC", () => {
  it("normalizeIC buang bukan-digit", () => {
    expect(normalizeIC("070118-14-0994")).toBe("070118140994");
  });
  it("isValidIC perlu 12 digit", () => {
    expect(isValidIC("080917074685")).toBe(true);
    expect(isValidIC("070118-14-0994")).toBe(true); // dinormal dahulu
    expect(isValidIC("12345")).toBe(false);
  });
});

describe("mapJawatanGuru", () => {
  it("petakan teks bebas ke enum", () => {
    expect(mapJawatanGuru("Penyelaras Kokurikulum")).toBe("Penyelaras");
    expect(mapJawatanGuru("Pemantau (KUPP)")).toBe("PemantauKUPP");
    expect(mapJawatanGuru("Ketua Guru Penasihat")).toBe("KetuaGP");
    expect(mapJawatanGuru("Guru Penasihat")).toBe("GuruPenasihat");
    expect(mapJawatanGuru("")).toBe("GuruPenasihat"); // lalai
  });
});

describe("parsePajskWorksheet — padanan lajur ikut header", () => {
  // Bina worksheet dalam memori: `baris` ialah senarai baris (1-based penuh).
  // Tetapkan sel satu per satu. Setter `row.values` ExcelJS menganggap array
  // 1-based dan akan menganjak lajur — memusnahkan ujian indeks-tetap.
  const buatWs = (baris: (string | number)[][]) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("t");
    baris.forEach((r, i) => {
      const row = ws.getRow(i + 1);
      r.forEach((v, j) => (row.getCell(j + 1).value = v));
    });
    return ws;
  };

  // Susun atur eksport "DUMM PAJSK": header di baris 1, nama lajur guna
  // "MYKAD" dan akhiran "PENCAPAIAN" (bukan "PERINGKAT").
  const HEADER_DUMM = ["Column1", "KELAS", "MAKLUMAT MURID", "MYKAD", "JANTINA",
    "SUKAN ", "JAWATAN SUKAN", "SUKAN PENCAPAIAN",
    "KELAB ", "JAWATAN KELAB", "KELAB PENCAPAIAN",
    "BADAN BERUNIFORM", "JAWATAN BADAN BERUNIFORM", "BADAN BERUNIFORM PENCAPAIAN"];
  const BARIS_DUMM = [1, "6AA", "ALI BIN ABU", "070402050048", "L",
    "KELAB PING PONG", "AHLI JAWATANKUASA", "SEKOLAH",
    "KELAB KERJAYA", "BENDAHARI", "ZON/DAERAH",
    "BRIGED BOMBA", "SARJAN", "SEKOLAH"];

  it("baca susun atur header-baris-1 (MYKAD / *PENCAPAIAN)", () => {
    const rows = parsePajskWorksheet(buatWs([HEADER_DUMM, BARIS_DUMM]));
    expect(rows).toHaveLength(1);
    expect(rows[0].noIc).toBe("070402050048");
    expect(rows[0].nama).toBe("ALI BIN ABU");
    expect(rows[0].ralat).toEqual([]);
    const sukan = rows[0].koko.find((k) => k.jenisKoko === "Sukan");
    expect(sukan).toMatchObject({ namaUnit: "KELAB PING PONG", jawatan: "AHLI JAWATANKUASA", peringkat: "SEKOLAH" });
    const uniform = rows[0].koko.find((k) => k.jenisKoko === "Uniform");
    expect(uniform).toMatchObject({ namaUnit: "BRIGED BOMBA", jawatan: "SARJAN", peringkat: "SEKOLAH" });
  });

  it("baca susun atur rasmi (header baris 4, akhiran PERINGKAT)", () => {
    const header = ["BIL", "NAMA", "NO KAD PENGENALAN",
      "SUKAN", "JAWATAN SUKAN", "PERINGKAT SUKAN",
      "KELAB", "JAWATAN KELAB", "PERINGKAT KELAB",
      "BADAN BERUNIFORM", "JAWATAN BADAN BERUNIFORM", "PERINGKAT BADAN BERUNIFORM"];
    const data = [1, "SITI BINTI OMAR", "080917074685",
      "BOLA JARING", "SETIAUSAHA", "NEGERI",
      "KELAB RUKUN NEGARA", "AHLI AKTIF", "SEKOLAH",
      "PENGAKAP", "PENOLONG KETUA", "DAERAH"];
    const rows = parsePajskWorksheet(buatWs([
      ["TAJUK"], [""], [""],
      header, data,
    ]));
    expect(rows).toHaveLength(1);
    expect(rows[0].noIc).toBe("080917074685");
    expect(rows[0].koko.find((k) => k.jenisKoko === "Kelab")).toMatchObject({
      namaUnit: "KELAB RUKUN NEGARA", jawatan: "AHLI AKTIF", peringkat: "SEKOLAH",
    });
  });

  it("jangan keliru lajur nama unit dengan lajur jawatan/peringkatnya", () => {
    const rows = parsePajskWorksheet(buatWs([HEADER_DUMM, BARIS_DUMM]));
    const kelab = rows[0].koko.find((k) => k.jenisKoko === "Kelab");
    // "KELAB", "JAWATAN KELAB" dan "KELAB PENCAPAIAN" semuanya mengandungi
    // "KELAB" — pembezaan mesti ikut struktur, bukan padanan separa.
    expect(kelab?.namaUnit).toBe("KELAB KERJAYA");
    expect(kelab?.jawatan).toBe("BENDAHARI");
    expect(kelab?.peringkat).toBe("ZON/DAERAH");
  });

  it("pulihkan sifar di hadapan yang digugurkan Excel", () => {
    const baris = [...BARIS_DUMM];
    baris[3] = 70402050048; // IC sebagai nombor, sifar hadapan hilang
    const rows = parsePajskWorksheet(buatWs([HEADER_DUMM, baris]));
    expect(rows[0].noIc).toBe("070402050048");
    expect(rows[0].ralat).toEqual([]);
  });

  it("tandai IC tidak sah sebagai ralat, bukan senyap", () => {
    const baris = [...BARIS_DUMM];
    baris[3] = "ABC";
    const rows = parsePajskWorksheet(buatWs([HEADER_DUMM, baris]));
    expect(rows[0].ralat[0]).toContain("No. IC tidak sah");
  });

  it("jatuh balik ke indeks lajur tetap bila tiada header dikenali", () => {
    // Fail tanpa baris header yang boleh dikenali: kekalkan tingkah laku lama
    // (header rasmi di baris 4, lajur pada kedudukan tetap).
    const data = [1, "ZAID BIN HASSAN", "070118140994",
      "BOLA SEPAK", "KAPTEN", "NEGERI",
      "KELAB SAINS", "AHLI AKTIF", "SEKOLAH",
      "PBSM", "SARJAN", "DAERAH"];
    const rows = parsePajskWorksheet(buatWs([
      ["SEKOLAH X"], ["LAPORAN"], [""], [""],
      data,
    ]));
    expect(rows).toHaveLength(1);
    expect(rows[0].noIc).toBe("070118140994");
    expect(rows[0].koko.find((k) => k.jenisKoko === "Sukan")).toMatchObject({
      namaUnit: "BOLA SEPAK", jawatan: "KAPTEN", peringkat: "NEGERI",
    });
  });

  it("langkau baris kosong", () => {
    const rows = parsePajskWorksheet(buatWs([
      HEADER_DUMM, BARIS_DUMM, ["", "", "", ""],
    ]));
    expect(rows).toHaveLength(1);
  });
});
