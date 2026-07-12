// ===========================================================================
//  Proxy (Next.js 16 — menggantikan middleware) — kawalan akses laluan.
//  Berjalan pada runtime edge: hanya sahkan JWT (jose). Tiada akses DB di sini.
// ===========================================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth-core";

// Peranan dibenarkan ikut awalan laluan
const RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["Admin"] },
  { prefix: "/guru", roles: ["Guru", "Admin"] },
  { prefix: "/pelajar", roles: ["Pelajar", "Admin"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("dari", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    // Hala ke dashboard peranan sendiri
    const home =
      session.role === "Admin" ? "/admin" : session.role === "Guru" ? "/guru" : "/pelajar";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*", "/pelajar/:path*"],
};
