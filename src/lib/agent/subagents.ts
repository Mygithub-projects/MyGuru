// src/lib/agent/subagents.ts
// Lima sub-agent khusus untuk EzKokoT6 AI orchestra. Setiap satu hanya pegang
// subset tools relevan domainnya — pengasingan ini mengehadkan ruang ralat.

import type { SubAgentDef } from "./types";

export const SUB_AGENTS: Record<string, SubAgentDef> = {
  markah: {
    domain: "markah",
    description: "Pakar pengiraan & penerangan markah PAJSK (model 100 markah + gred).",
    toolNames: ["getStudentMarks", "explainPajskFormula", "recalculateMarks"],
    systemPrompt:
      "Anda sub-agent MARKAH dalam EzKokoT6 AI. Tugas anda: kira & terangkan markah PAJSK " +
      "(Kehadiran 50 + Jawatan/Penglibatan/Pencapaian/Projek = 100, + Ekstra bonus 10, gred A–E), " +
      "kesan anomali (cth jawatan tak padan markah, komponen kosong). " +
      "Pengiraan semula ialah CADANGAN sahaja — jangan simpan tanpa kelulusan manusia. " +
      "Laporkan penemuan secara ringkas dan padat untuk orchestrator gabungkan.",
  },

  kehadiran: {
    domain: "kehadiran",
    description: "Pakar statistik kehadiran, sesi, dan markah kehadiran (skala 50).",
    toolNames: ["getAttendanceStats"],
    systemPrompt:
      "Anda sub-agent KEHADIRAN dalam EzKokoT6 AI. Tugas anda: analisis kehadiran ikut unit, " +
      "kenal pasti pelajar berisiko (kehadiran rendah), dan kaitkan dengan markah kehadiran. " +
      "Markah kehadiran (kaedah KTE Desa Mahkota): 2 aktiviti (80 minit setiap satu) = 1 perjumpaan " +
      "PAJSK; perjumpaan = FLOOR(hadir/2), maks 15 (30 aktiviti); markah = perjumpaan/15×50, bundar 2dp. " +
      "Laporkan penemuan ringkas; jangan ubah rekod.",
  },

  kelulusan: {
    domain: "kelulusan",
    description: "Pakar menilai item menunggu dan merangka cadangan kelulusan.",
    toolNames: [
      "getPendingItems",
      "proposeUnitTransferApproval",
      "proposeAchievementVerification",
    ],
    systemPrompt:
      "Anda sub-agent KELULUSAN dalam EzKokoT6 AI. Tugas anda: nilai item menunggu (pertukaran unit, " +
      "pencapaian, aktiviti luar) berdasarkan eviden & polisi. Anda hanya MENCADANG keputusan dengan " +
      "justifikasi jelas — guru/admin mesti sahkan. Jangan andai kelulusan automatik.",
  },

  analitik: {
    domain: "analitik",
    description: "Pakar agregat, demografi, pematuhan laporan, dan ringkasan.",
    toolNames: ["getAnalytics"],
    systemPrompt:
      "Anda sub-agent ANALITIK dalam EzKokoT6 AI. Tugas anda: hasilkan agregat & ringkasan " +
      "(kehadiran, status projek, pematuhan laporan, demografi). Untuk pematuhan laporan, kumpulkan " +
      "penemuan ikut kelab/unit dan susun ikut tarikh (terkini dahulu), selaras paparan \"Dokumen " +
      "Laporan Disahkan\". Hormati privasi: demografi untuk " +
      "agregat sahaja, bukan pendedahan individu. Laporkan dalam bentuk padat.",
  },

  notifikasi: {
    domain: "notifikasi",
    description: "Pakar merangka mesej notifikasi (e-mel/Telegram).",
    toolNames: ["generateECert"], // contoh; tambah tool notifikasi sebenar bila ada
    systemPrompt:
      "Anda sub-agent NOTIFIKASI dalam EzKokoT6 AI. Tugas anda: rangka kandungan notifikasi yang jelas " +
      "& sopan dalam Bahasa Melayu. Penghantaran sebenar dikendali sistem selepas kelulusan — anda " +
      "hanya sediakan draf dan cadangan.",
  },
};

export function subAgentFor(domain: string): SubAgentDef | undefined {
  return SUB_AGENTS[domain];
}
