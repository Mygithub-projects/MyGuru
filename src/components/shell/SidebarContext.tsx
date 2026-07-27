"use client";
import { createContext, useContext, useState } from "react";

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

/** Kongsi status buka/tutup sidebar mudah alih antara butang hamburger (Topbar) & Sidebar itu sendiri. */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useSidebar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
