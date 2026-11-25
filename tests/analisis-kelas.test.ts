import { describe, expect, it } from "vitest";
import { analisisKelas, catatanGred } from "../src/lib/pajsk";

describe("analisisKelas (borang PAJSK kelas)", () => {
  it("ikut contoh 6AA: 94 & 92.5 → 2 A, purata 93.25, GP 1, ETR 1.00", () => {
    const a = analisisKelas([94, 92.5, null]);
    expect(a.bil).toBe(2);
    expect(a.gred.A).toEqual({ bil: 2, peratus: 100 });
    expect(a.bilAC).toBe(2);
    expect(a.purata).toBe(93.25);
    expect(a.gredPurata).toBe("A");
    expect(a.gp).toBe(1);
    expect(a.etr).toBe(1);
    expect(a.ambang.map((x) => x.bil)).toEqual([2, 2, 2, 2, 1, 1, 0]);
  });

  it("GP kelas = Σ(bil × mata gred) ÷ bil; ETR = GP − 3%", () => {
    const a = analisisKelas([85, 70, 50, 30, 10]); // A B C D E
    expect(a.gp).toBe(3);
    expect(a.etr).toBe(2.91);
    expect(a.bilAC).toBe(3);
    expect(a.peratusAC).toBe(60);
  });

  it("kelas tanpa markah", () => {
    const a = analisisKelas([null, undefined]);
    expect(a.bil).toBe(0);
    expect(a.purata).toBeNull();
    expect(a.etr).toBeNull();
  });

  it("catatan ikut gred", () => {
    expect(catatanGred("A")).toMatch(/^Syabas/);
    expect(catatanGred("E")).toMatch(/tidak memuaskan/);
    expect(catatanGred("")).toBe("");
  });
});
