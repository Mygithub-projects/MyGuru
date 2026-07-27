"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "./icons";
import { useSidebar } from "./SidebarContext";
import type { NavItem } from "@/lib/nav";

export const OPEN_NOTIF_EVENT = "myguru:open-notif";
export const OPEN_CHAT_EVENT = "myguru:open-chat";

function isActive(pathname: string, href: string): boolean {
  if (href === "/pelajar" || href === "/guru" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  items,
  brandTitle,
  brandSubtitle,
  institusi,
}: {
  items: NavItem[];
  brandTitle: string;
  brandSubtitle: string;
  institusi: string;
}) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-ink text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <Image
            src="/logo-kpm.png"
            alt="Logo KPM"
            width={40}
            height={40}
            className="rounded-lg bg-white p-1 ring-2 ring-gold/40"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-white">{brandTitle}</p>
            <p className="truncate text-[11px] leading-tight text-gold">{brandSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item, i) => {
            if (item.action) {
              return (
                <button
                  key={`${item.action}-${i}`}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new Event(item.action === "notif" ? OPEN_NOTIF_EVENT : OPEN_CHAT_EVENT));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            }

            const active = item.href ? isActive(pathname, item.href) : false;
            return (
              <Link
                key={item.href}
                href={item.href!}
                title={item.label}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-gold bg-white/10 text-white"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-3 text-[10px] text-white/40">{institusi}</div>
      </aside>
    </>
  );
}
