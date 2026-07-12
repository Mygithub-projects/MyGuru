import { describe, it, expect } from "vitest";
import { icToString } from "../src/lib/import";
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
