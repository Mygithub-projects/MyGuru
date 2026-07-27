import { getT } from "@/lib/locale";
import { getNavForRole } from "@/lib/nav";
import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export async function AppShell({
  nama,
  role,
  subRole,
  children,
  footer,
}: {
  nama: string;
  role: string;
  subRole?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = await getT();
  const items = getNavForRole(role, subRole, t);
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";

  return (
    <SidebarProvider>
      <div className="app-shell flex min-h-screen flex-1">
        <Sidebar items={items} brandTitle="MyGuru AI" brandSubtitle="Active Hands, Brilliant Minds" institusi={institusi} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar nama={nama} role={role} subRole={subRole} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
          {footer}
        </div>
      </div>
    </SidebarProvider>
  );
}
