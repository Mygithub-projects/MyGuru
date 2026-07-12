// src/lib/agent/session.ts
// Terbitkan AgentContext (RBAC + skop) daripada sesi JWT — PENTING: skop datang
// dari pelayan, bukan badan permintaan. Model TIDAK boleh mempengaruhi skop ini.

import type { SessionPayload } from "@/lib/auth-core";
import type { AgentContext } from "./types";
import { prisma } from "@/lib/prisma";

/** Jawatan guru yang melihat seluruh sekolah (bukan terhad unit seliaan). */
const JAWATAN_SKOP_SEKOLAH = new Set(["Penyelaras", "PemantauKUPP", "PenolongSU"]);

/**
 * Bina AgentContext daripada SessionPayload.
 * - Pelajar  → scope.pelajarId (data diri sendiri sahaja)
 * - Guru     → scope.guruId + scope.unitIds (unit seliaan); jawatan skop-sekolah → isAdmin
 * - Admin    → scope.isAdmin
 */
export async function deriveAgentContext(session: SessionPayload): Promise<AgentContext> {
  const scope: AgentContext["scope"] = {};

  if (session.role === "Pelajar") {
    scope.pelajarId = session.pelajarId ?? undefined;
  } else if (session.role === "Admin") {
    scope.isAdmin = true;
  } else if (session.role === "Guru") {
    scope.guruId = session.guruId ?? undefined;
    if (session.guruId) {
      const guru = await prisma.guru.findUnique({ where: { id: session.guruId } });
      if (guru) {
        scope.unitIds = [guru.kelabDiselia, guru.sukanDiselia, guru.badanDiselia].filter(
          (u): u is string => Boolean(u)
        );
        if (JAWATAN_SKOP_SEKOLAH.has(guru.jawatanKoko)) scope.isAdmin = true;
      }
    }
  }

  return {
    userId: session.userId,
    peranan: session.role,
    subRole: session.subRole ?? null,
    scope,
  };
}
