import type { IconName } from "@/components/shell/icons";
import type { Dict } from "./i18n";

export interface NavItem {
  href?: string;
  label: string;
  icon: IconName;
  action?: "notif" | "chat";
}

/** Buang emel/ikon emoji utama dari label sedia ada (label pil aksi lama). */
function stripEmoji(label: string): string {
  return label.replace(/^[\p{Extended_Pictographic}️‍]+\s*/u, "");
}

export function getNavForRole(role: string, subRole: string | null | undefined, t: Dict): NavItem[] {
  const notifChat: NavItem[] = [
    { label: t.header.notifications, icon: "bell", action: "notif" },
    { label: t.header.chatbot, icon: "chat", action: "chat" },
  ];

  if (role === "Pelajar") {
    const items: NavItem[] = [
      { href: "/pelajar", label: t.common.dashboard, icon: "dashboard" },
      { href: "/pelajar/aktiviti", label: stripEmoji(t.pelajar.linkAktiviti), icon: "achievements" },
    ];
    if (subRole === "SU" || subRole === "NSU") {
      items.push(
        { href: "/pelajar/kehadiran", label: stripEmoji(t.pelajar.linkKehadiran), icon: "attendance" },
        { href: "/pelajar/laporan", label: stripEmoji(t.pelajar.linkLaporan), icon: "reports" },
        { href: "/pelajar/jawatan", label: stripEmoji(t.pelajar.linkJawatan), icon: "members" },
      );
    }
    items.push({ href: "/pelajar/tukar-unit", label: t.pelajar.transferTitle, icon: "transfer" });
    return [...items, ...notifChat];
  }

  if (role === "Guru") {
    return [
      { href: "/guru", label: t.common.dashboard, icon: "dashboard" },
      { href: "/guru/ahli", label: stripEmoji(t.guru.linkMembers), icon: "members" },
      { href: "/guru/kehadiran", label: stripEmoji(t.guru.linkAttendance), icon: "attendance" },
      { href: "/guru/analitik", label: stripEmoji(t.guru.linkAnalytics), icon: "analytics" },
      { href: "/guru/pemilihan", label: stripEmoji(t.guru.linkSelection), icon: "trophy" },
      ...notifChat,
    ];
  }

  // Admin
  return [
    { href: "/admin", label: t.common.dashboard, icon: "dashboard" },
    { href: "/admin/pelajar", label: t.admin.actManageStudents, icon: "members" },
    { href: "/admin/guru", label: t.admin.actManageTeachers, icon: "members" },
    { href: "/admin/import", label: t.admin.actImport, icon: "import" },
    { href: "/admin/kehadiran", label: t.admin.actAttendance, icon: "attendance" },
    { href: "/admin/demografi", label: t.admin.actDemographics, icon: "demographics" },
    { href: "/admin/analitik", label: stripEmoji(t.admin.actAnalytics), icon: "analytics" },
    { href: "/admin/sijil", label: t.admin.actCertTemplate, icon: "cert" },
    { href: "/admin/tetapan", label: t.admin.actFormula, icon: "settings" },
    ...notifChat,
  ];
}
