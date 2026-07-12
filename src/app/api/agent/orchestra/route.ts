// src/app/api/agent/orchestra/route.ts
// Endpoint tugas orchestra (pelbagai-domain / kelompok). Berasingan daripada chat interaktif.
// Hanya guru/admin — pelajar tidak guna orchestra.

import { NextRequest, NextResponse } from "next/server";
import { runOrchestra } from "@/lib/agent/orchestrator";
import { getSession } from "@/lib/auth";
import { deriveAgentContext } from "@/lib/agent/session";

export const runtime = "nodejs";
export const maxDuration = 300; // orchestra boleh ambil masa; naikkan had (Vercel)

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }
  if (session.role === "Pelajar") {
    return NextResponse.json(
      { error: "Orchestra untuk guru/admin sahaja." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as { task?: string };
  if (!body.task?.trim()) {
    return NextResponse.json({ error: "Tugas kosong." }, { status: 400 });
  }

  const ctx = await deriveAgentContext(session);

  try {
    const result = await runOrchestra(ctx, body.task);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Ralat orchestra:", e);
    return NextResponse.json({ error: "Ralat dalaman orchestra." }, { status: 500 });
  }
}
