import Link from "next/link";
import { LogoutButton } from "../LogoutButton";
import { NotifBell } from "../NotifBell";
import { ThemeToggle } from "../LandingClient";
import { TindakanBadge } from "../TindakanBadge";
import { LanguageToggle } from "../LanguageToggle";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { getT } from "@/lib/locale";
import { KohortPilih } from "../KohortPilih";
import { kohortDipilih, senaraiSemuaKohort } from "@/lib/kohort-pilihan";

function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function Topbar({
  nama,
  role,
  subRole,
  jawatan,
}: {
  nama: string;
  role: string;
  subRole?: string | null;
  /** Label jawatan sebenar (guru) — menggantikan label peranan umum. */
  jawatan?: string | null;
}) {
  const { locale, t } = await getT();
  const staf = role === "Guru" || role === "Admin";
  const [kohort, senaraiKohort] = staf ? await Promise.all([kohortDipilih(), senaraiSemuaKohort()]) : [null, []];
  const roleLabel: Record<string, string> = {
    Pelajar: t.header.roleStudent,
    Guru: t.header.roleTeacher,
    Admin: t.header.roleAdmin,
  };
  const dashHref = role === "Admin" ? "/admin" : "/guru";

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <SidebarToggleButton />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-slate-800">{nama}</p>
        <p className="truncate text-[11px] leading-tight text-slate-500">
          {jawatan || (roleLabel[role] ?? role)}
          {subRole && subRole !== "Pelajar" ? ` · ${subRole}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {staf && (
          <KohortPilih kohort={kohort} senarai={senaraiKohort} label={t.chrome.kohortLabel} labelArkib={t.chrome.kohortArkib} />
        )}
        {(role === "Guru" || role === "Admin") && (
          <TindakanBadge href={dashHref} onLight label={t.chrome.tindakanLabel} title={t.chrome.tindakanTitle} />
        )}
        <LanguageToggle locale={locale} onLight />
        <ThemeToggle />
        <NotifBell onLight t={t.chrome} />
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark"
          title={nama}
        >
          {initials(nama)}
        </div>
        <Link href="/tukar-kata-laluan" title={t.header.changePassword} aria-label={t.header.changePassword}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-800">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M15.5 2a4.5 4.5 0 00-4.42 5.34L2 16.4V19h2.6l1-1h1.9v-1.9h1.9l1.32-1.32A4.5 4.5 0 1015.5 2zm1 3a1 1 0 110 2 1 1 0 010-2z" /></svg>
        </Link>
        <LogoutButton label={t.header.logout} onLight />
      </div>
    </header>
  );
}
