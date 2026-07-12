// src/app/api/agent/chat/route.ts
// Endpoint chat agent. Konteks pengguna diambil dari SESI — bukan dari badan permintaan.

import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/loop";
import type { AgentTurn } from "@/lib/agent/types";
import { getSession } from "@/lib/auth";
import { deriveAgentContext } from "@/lib/agent/session";

export const runtime = "nodejs"; // perlu Node (SDK + bcrypt), bukan edge

export async function POST(req: NextRequest) {
  // 1) Sahkan sesi & bina konteks dari pelayan — JANGAN percaya peranan dari klien.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = (await req.json()) as { message?: string; history?: AgentTurn[] };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Mesej kosong." }, { status: 400 });
  }

  // Peranan & skop diterbit dari JWT pelayan — model tidak boleh memintasnya.
  const ctx = await deriveAgentContext(session);

  try {
    const result = await runAgent(ctx, body.history ?? [], body.message);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Ralat agent:", e);
    return NextResponse.json({ error: "Ralat dalaman agent." }, { status: 500 });
  }
}
