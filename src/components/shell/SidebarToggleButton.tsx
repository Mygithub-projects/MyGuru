"use client";
import { useSidebar } from "./SidebarContext";

export function SidebarToggleButton() {
  const { setOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-white/70 dark:hover:bg-white/10"
      aria-label="Buka menu"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
