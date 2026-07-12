import Image from "next/image";
import { LogoutButton } from "./LogoutButton";
import { NotifBell } from "./NotifBell";
import { ThemeToggle } from "./LandingClient";
import { TindakanBadge } from "./TindakanBadge";
import { LanguageToggle } from "./LanguageToggle";
import { getT } from "@/lib/locale";

export async function AppHeader({
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
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";
  return (
    <header className="bg-ink text-white shadow-lg border-b-2 border-white/20">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Image
          src="/logo-ktedm.jpeg"
          alt="Logo"
          width={44}
          height={44}
          className="rounded-full bg-white p-0.5 ring-2 ring-white/30"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight text-white">KoKurikulum</p>
          <p className="truncate text-[11px] text-white/70">{institusi}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight">{nama}</p>
          <p className="text-[11px] text-white/80">
            {roleLabel[role] ?? role}
            {subRole && subRole !== "Pelajar" ? ` · ${subRole}` : ""}
          </p>
        </div>
        {(role === "Guru" || role === "Admin") && <TindakanBadge href={dashHref} />}
        <LanguageToggle locale={locale} />
        <a href="/bantuan" className="rounded-md bg-white/10 px-2.5 py-1.5 text-sm text-white hover:bg-white/20" title={t.header.help} aria-label={t.header.help}>?</a>
        <ThemeToggle onDark />
        <NotifBell />
        <LogoutButton label={t.header.logout} />
      </div>
    </header>
  );
}
