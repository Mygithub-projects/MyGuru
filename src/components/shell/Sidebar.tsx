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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden bg-ink text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Jalur serong api — gema blok perisai logo */}
        <div aria-hidden className="ez-slash -right-16 -top-6 flex h-40 gap-1.5 opacity-90">
          <i className="w-10 bg-ez-red" /><i className="w-5 bg-ez-flame" /><i className="w-2 bg-ez-amber" />
        </div>
        <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
          <Image
            src="/logo-ezkoko.webp"
            alt="Logo EzKoko KTEDM"
            width={52}
            height={56}
            className="h-14 w-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase italic leading-none text-white">
              {brandTitle.replace(/T6$/, "")}<span className="text-ez-red">{brandTitle.endsWith("T6") ? "T6" : ""}</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-gold">{brandSubtitle}</p>
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

        <div className="relative mx-5 h-px bg-gradient-to-r from-ez-red via-ez-flame to-transparent" />
        <p className="relative px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Menu</p>
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
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
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
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
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-ez-red to-ez-red/70 text-white shadow-lg shadow-ez-red/20"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-white/45 group-hover:text-ez-amber"}`} />
                <span className="truncate">{item.label}</span>
                {active && <span aria-hidden className="ml-auto h-4 w-1.5 -skew-x-12 rounded-sm bg-ez-amber" />}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 px-5 py-3 text-[10px] leading-snug text-white/40">{institusi}</div>
      </aside>
    </>
  );
}
