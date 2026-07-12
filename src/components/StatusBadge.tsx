// Palet korporat: kejayaan=emerald, naik pangkat=royal blue,
// amaran=amber, bahaya=merah, neutral=slate.
const EMERALD = "background:#d1fae5;color:#065f46"; // kejayaan / stabil
const BIRU = "background:#dbeafe;color:#1e40af"; // naik pangkat / maklumat
const AMBER = "background:#fef3c7;color:#92400e"; // perhatian / menunggu
const ORANGE = "background:#ffedd5;color:#9a3412"; // kuiri
const MERAH = "background:#fee2e2;color:#991b1b"; // tolak / turun
const SLATE = "background:#f1f5f9;color:#475569"; // neutral / draf

const WARNA: Record<string, string> = {
  Kekal: EMERALD,
  Bertukar: AMBER,
  "Naik Pangkat": BIRU,
  Bertambah: EMERALD,
  Turun: MERAH,
  "-": SLATE,
  // status semakan
  Pending: AMBER,
  Draft: SLATE,
  Approved: EMERALD,
  Kuiri: ORANGE,
  Reject: MERAH,
  None: SLATE,
  // status pilihan unit T6
  "Belum Pilih": SLATE,
  "Mohon Tukar": AMBER,
  Disahkan: EMERALD,
};

export function StatusBadge({ status }: { status: string }) {
  const style = WARNA[status] ?? WARNA["-"];
  const css = Object.fromEntries(style.split(";").map((s) => s.split(":"))) as Record<string, string>;
  return (
    <span className="badge" style={{ backgroundColor: css.background, color: css.color }}>
      {status}
    </span>
  );
}
