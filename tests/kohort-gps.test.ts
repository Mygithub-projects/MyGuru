import { describe, expect, it } from "vitest";
import { kitaranKohort, kohortSeterusnya, normalKohort, tambahBulan } from "../src/lib/kohort";
import { kiraGps } from "../src/lib/rumusan";

describe("normalKohort", () => {
  it("menormalkan pelbagai bentuk input", () => {
    expect(normalKohort("STPM 2027")).toBe("STPM 2027");
    expect(normalKohort("stpm2028")).toBe("STPM 2028");
    expect(normalKohort(" 2029 ")).toBe("STPM 2029");
  });
  it("menolak input tidak sah", () => {
    expect(normalKohort("")).toBeNull();
    expect(normalKohort("SPM 2027")).toBeNull();
    expect(normalKohort("STPM 27")).toBeNull();
    expect(normalKohort(null)).toBeNull();
  });
});

describe("kohortSeterusnya", () => {
  it("tahun terkini + 1", () => {
    expect(kohortSeterusnya(["STPM 2027"])).toBe("STPM 2028");
    expect(kohortSeterusnya(["STPM 2027", "STPM 2029", "STPM 2028"])).toBe("STPM 2030");
  });
  it("tiada kohort → tahun semasa + 1", () => {
    expect(kohortSeterusnya([], 2026)).toBe("STPM 2027");
  });
});

describe("kitaranKohort (18 bulan, kohort baharu bulan ke-8)", () => {
  const mula = new Date(Date.UTC(2026, 0, 15)); // 15 Jan 2026
  it("bulan pertama & jangka tamat +18 bulan", () => {
    const c = kitaranKohort(mula, new Date(Date.UTC(2026, 0, 20)));
    expect(c.bulanKe).toBe(1);
    expect(c.fasa).toBe("awal");
    expect(c.jangkaTamat.toISOString().slice(0, 10)).toBe("2027-07-15");
    expect(c.jangkaKohortBaharu.toISOString().slice(0, 10)).toBe("2026-08-15");
  });
  it("bulan ke-8 → sedia kohort baharu", () => {
    const c = kitaranKohort(mula, new Date(Date.UTC(2026, 7, 15)));
    expect(c.bulanKe).toBe(8);
    expect(c.fasa).toBe("sediaBaharu");
  });
  it("selepas 18 bulan → patut tamat (bulan dihadkan 18)", () => {
    const c = kitaranKohort(mula, new Date(Date.UTC(2027, 7, 1)));
    expect(c.fasa).toBe("patutTamat");
    expect(c.bulanKe).toBe(18);
  });
  it("tambahBulan menghadkan ke hujung bulan", () => {
    expect(tambahBulan(new Date(Date.UTC(2026, 0, 31)), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("kiraGps", () => {
  const g = (A: number, B: number, C: number, D: number, E: number) => ({ A, B, C, D, E });
  it("semua A = 1.00, semua E = 5.00", () => {
    expect(kiraGps(g(10, 0, 0, 0, 0))).toBe(1);
    expect(kiraGps(g(0, 0, 0, 0, 214))).toBe(5);
  });
  it("purata berwajaran, 2 titik perpuluhan", () => {
    // (2×1 + 1×2 + 0×3 + 0×4 + 1×5) / 4 = 2.25
    expect(kiraGps(g(2, 1, 0, 0, 1))).toBe(2.25);
    // (1×1 + 1×2 + 1×3) / 3 = 2
    expect(kiraGps(g(1, 1, 1, 0, 0))).toBe(2);
  });
  it("tiada pelajar bergred → null", () => {
    expect(kiraGps(g(0, 0, 0, 0, 0))).toBeNull();
  });
});
