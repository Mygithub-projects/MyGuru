import { describe, expect, it } from "vitest";
import { normalKohort } from "../src/lib/kohort";
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
