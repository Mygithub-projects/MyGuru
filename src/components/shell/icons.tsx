// Ikon SVG ringkas (stroke, tiada dependency luaran) untuk sidebar navigasi.
export type IconName =
  | "dashboard" | "members" | "attendance" | "analytics" | "trophy"
  | "achievements" | "reports" | "transfer" | "bell" | "chat"
  | "settings" | "import" | "demographics" | "cert" | "admin" | "scan";

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  members: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="8" r="2.4" />
      <path d="M16.5 14.2c2.7.4 4.5 2.6 4.5 5.8" />
    </>
  ),
  attendance: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8 14l2.2 2.2L16 10.5" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" />
      <path d="M12 13v4M9 21h6M9 21c0-2 1-3 3-3s3 1 3 3" />
    </>
  ),
  achievements: (
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z" />
  ),
  reports: (
    <>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M8.5 12.5h7M8.5 15.5h7M8.5 9.5h3" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 8h13M17 8l-3-3M17 8l-3 3" />
      <path d="M20 16H7M7 16l3 3M7 16l3-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" />
      <path d="M8 10h8M8 13.5h5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </>
  ),
  import: (
    <>
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </>
  ),
  demographics: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" />
    </>
  ),
  cert: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 8 21l4-2 4 2-1-7.5" />
    </>
  ),
  admin: (
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M4 12h16" />
    </>
  ),
};

export function NavIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}
