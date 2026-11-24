import { getT } from "@/lib/locale";
import { getNavForRole } from "@/lib/nav";
import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export async function AppShell({
  nama,
  role,
  subRole,
  jawatan,
  children,
  footer,
  adaProjek = false,
  sahkanKehadiranGuru = false,
  subRoleLabel,
}: {
  nama: string;
  role: string;
  subRole?: string | null;
  jawatan?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
  adaProjek?: boolean;
  sahkanKehadiranGuru?: boolean;
  subRoleLabel?: string | null;
}) {
  const { t } = await getT();
  const items = getNavForRole(role, subRole, t, adaProjek, sahkanKehadiranGuru);
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";

  return (
    <SidebarProvider>
      <div className="app-shell flex min-h-screen flex-1">
        <Sidebar items={items} brandTitle="EzKokoT6" brandSubtitle="Active Hands, Brilliant Minds" institusi={institusi} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar nama={nama} role={role} subRole={subRole} jawatan={jawatan} subRoleLabel={subRoleLabel} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          {footer}
        </div>
      </div>
    </SidebarProvider>
  );
}
