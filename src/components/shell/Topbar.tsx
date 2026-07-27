import { LogoutButton } from "../LogoutButton";
import { NotifBell } from "../NotifBell";
import { ThemeToggle } from "../LandingClient";
import { TindakanBadge } from "../TindakanBadge";
import { LanguageToggle } from "../LanguageToggle";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { getT } from "@/lib/locale";

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
}: {
  nama: string;
  role: string;
  subRole?: string | null;
}) {
  const { locale, t } = await getT();
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
          {roleLabel[role] ?? role}
          {subRole && subRole !== "Pelajar" ? ` · ${subRole}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
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
        <LogoutButton label={t.header.logout} onLight />
      </div>
    </header>
  );
}
