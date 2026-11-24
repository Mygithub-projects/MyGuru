import Image from "next/image";
import Link from "next/link";
import { Reveal, ThemeToggle } from "./LandingClient";

/* Ikon garis ringkas (stroke = currentColor) — ganti emoji. */
const IKON: Record<string, React.ReactNode> = {
  markah: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  tukar: <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
  sijil: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></>,
  ai: <><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>,
  kunci: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};

function Ikon({ n, className = "h-5 w-5" }: { n: keyof typeof IKON; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {IKON[n]}
    </svg>
  );
}

const CIRI: { ikon: keyof typeof IKON; tajuk: string; teks: string }[] = [
  { ikon: "markah", tajuk: "Markah PAJSK Automatik", teks: "Kehadiran, jawatan, penglibatan, pencapaian dan projek dikira terus mengikut formula PAJSK rasmi. Tiada kiraan manual." },
  { ikon: "tukar", tajuk: "Pendaftaran & Pertukaran Unit", teks: "Pelajar daftar atau tukar Kelab, Sukan dan Badan Beruniform. Guru penasihat meluluskan, jawatan dan markah dikemas kini sendiri." },
  { ikon: "sijil", tajuk: "e-Cert & Butiran Diri", teks: "Sijil PDF rasmi dengan No. Siri unik, dijana sendiri oleh pelajar selepas aktiviti disahkan guru." },
  { ikon: "ai", tajuk: "Analitik Pintar (AI)", teks: "Tren kehadiran, status pilihan unit T6 dan ringkasan AI dengan cadangan tindakan untuk guru dan pentadbir." },
  { ikon: "qr", tajuk: "Kehadiran QR", teks: "Setiausaha buka sesi perjumpaan, ahli imbas kod QR. Markah kehadiran dikemas kini serta-merta." },
  { ikon: "kunci", tajuk: "Selamat & Patuh PDPA", teks: "Akses berperingkat Pelajar, Guru, Admin serta SU/NSU. Kata laluan disulitkan dengan bcrypt." },
];

const PERANAN = [
  { tajuk: "Pelajar", teks: "Lihat pecahan markah PAJSK, isi pencapaian dan aktiviti luar, mohon tukar unit, dan cetak e-Cert.", band: "bg-ez-red" },
  { tajuk: "Guru", teks: "Pantau unit seliaan, sahkan atau kuiri laporan dan pencapaian, luluskan pertukaran, dan lihat analitik.", band: "bg-ez-ink dark:bg-ez-ink-2" },
  { tajuk: "Pentadbir", teks: "Import data, tetapkan formula markah dan templat sijil, urus kohort, dan analitik seluruh sekolah.", band: "bg-ez-flame" },
];

const FASA = [
  { t: "Integrasi Data", d: "Import data pelajar & guru" },
  { t: "Setiausaha", d: "Laporan & kehadiran" },
  { t: "Pengiraan", d: "Markah automatik" },
  { t: "Aktiviti & Sijil", d: "Eviden → e-Cert" },
  { t: "Semakan Guru", d: "Sahkan & notifikasi" },
];

const FAQ = [
  { s: "Bagaimana pelajar log masuk?", j: "Menggunakan No. Kad Pengenalan sebagai ID. Kata laluan lalai wajib ditukar pada log masuk pertama." },
  { s: "Adakah markah PAJSK dikira secara automatik?", j: "Ya. Setiap bidang (Sukan, Kelab, Badan Beruniform) diberi markah daripada 100. Markah T6 ialah purata 2 bidang terbaik ditambah ekstra kurikulum, maksimum 100." },
  { s: "Bagaimana gred ditentukan?", j: "A (80–100), B (60–79), C (40–59), D (20–39), E (0–19)." },
  { s: "Bolehkah pelajar cetak sijil sendiri?", j: "Ya. e-Cert PDF rasmi dengan No. Siri unik dijana sendiri oleh pelajar selepas aktiviti disahkan oleh guru." },
  { s: "Adakah ia selamat dan mematuhi PDPA?", j: "Ya. Akses berperingkat, kata laluan disulitkan (bcrypt), HTTPS, dan rahsia sistem disimpan di luar kod." },
  { s: "Perlukah pemasangan?", j: "Tidak. Sistem berasaskan web dan berfungsi pada telefon, tablet dan komputer." },
];

const SKOR = [
  { v: "50", l: "markah maksimum kehadiran" },
  { v: "2+1", l: "2 bidang terbaik + ekstra" },
  { v: "A–E", l: "gred dikira automatik" },
  { v: "0", l: "borang kertas" },
];

const display = "font-[family-name:var(--font-display)]";

export function Landing({ institusi }: { institusi: string }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-ez-paper text-ez-ink dark:bg-ez-ink dark:text-ez-cream">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-ez-paper/85 backdrop-blur dark:border-white/10 dark:bg-ez-ink/85">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Image src="/logo-ezkoko.webp" alt="Logo EzKoko KTEDM" width={44} height={47} className="h-11 w-auto" priority />
          <div className="min-w-0 flex-1">
            <p className={`${display} text-xl font-extrabold uppercase italic leading-none tracking-wide`}>
              EzKoko<span className="text-ez-red">T6</span>
            </p>
            <p className="hidden truncate text-[11px] text-black/55 dark:text-white/55 sm:block">{institusi}</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-black/65 dark:text-white/70 md:flex">
            <a href="#ciri" className="hover:text-ez-red">Ciri</a>
            <a href="#peranan" className="hover:text-ez-red">Peranan</a>
            <a href="#aliran" className="hover:text-ez-red">Aliran</a>
            <a href="#faq" className="hover:text-ez-red">FAQ</a>
          </nav>
          <ThemeToggle />
          <Link href="/login" className={`${display} rounded-md bg-ez-red px-4 py-2 text-base font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ez-red-hover`}>
            Log Masuk
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="ez-bg ez-cut relative overflow-hidden pb-16 text-ez-cream">
        {/* jalur serong seperti blok perisai logo */}
        <div aria-hidden className="ez-slash -right-24 top-0 hidden h-full w-[34rem] gap-3 md:flex">
          <i className="w-24 bg-ez-red/90" />
          <i className="w-16 bg-ez-flame/85" />
          <i className="w-8 bg-ez-amber/80" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-sm border-l-4 border-ez-amber bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-ez-amber">
              Active Hands, Brilliant Minds
            </span>
            <h1 className={`${display} mt-5 text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl lg:text-7xl`}>
              Kokurikulum T6,
              <br />
              <span className="ez-flame-text pr-2">tanpa kertas.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ez-cream/80">
              Rekod kehadiran, jawatan, pencapaian dan projek di satu tempat. Markah PAJSK dikira sendiri,
              guru sahkan, pelajar cetak e-Cert.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={`${display} rounded-md bg-ez-red px-7 py-3 text-lg font-bold uppercase tracking-wide text-white shadow-lg shadow-ez-red/30 transition hover:-translate-y-0.5 hover:bg-ez-red-hover`}>
                Log Masuk →
              </Link>
              <a href="#ciri" className={`${display} rounded-md px-7 py-3 text-lg font-bold uppercase tracking-wide text-ez-cream ring-2 ring-ez-cream/30 transition hover:bg-white/10`}>
                Lihat Ciri
              </a>
            </div>
          </Reveal>

          <Reveal className="relative mx-auto w-full max-w-sm">
            <div aria-hidden className="absolute inset-8 rounded-full bg-ez-flame/40 blur-3xl" />
            <Image
              src="/logo-ezkoko.webp"
              alt="Logo EzKoko KTEDM"
              width={420}
              height={448}
              priority
              className="ez-float relative mx-auto h-auto w-64 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] sm:w-80"
            />
            {/* kad skor terapung */}
            <div className="absolute -bottom-2 left-0 rounded-lg bg-ez-cream px-4 py-3 text-ez-ink shadow-2xl ring-2 ring-ez-ink sm:-left-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Markah PAJSK T6</p>
              <p className={`${display} text-4xl font-extrabold leading-none`}>
                95<span className="text-base font-bold text-black/40"> /100</span>
                <span className="ml-2 rounded-sm bg-ez-red px-1.5 align-middle text-sm text-white">A</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-black/55">(93 + 83) ÷ 2 + 7</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PAPAN SKOR */}
      <section className="-mt-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 overflow-hidden rounded-xl bg-ez-ink text-ez-cream shadow-xl ring-4 ring-ez-paper dark:ring-ez-ink sm:grid-cols-4">
          {SKOR.map((s, i) => (
            <div key={s.l} className={`px-4 py-5 text-center ${i > 0 ? "sm:border-l sm:border-white/10" : ""} ${i % 2 ? "border-l border-white/10" : ""} ${i > 1 ? "border-t border-white/10 sm:border-t-0" : ""}`}>
              <p className={`${display} text-4xl font-extrabold italic ${i % 2 ? "text-ez-amber" : "text-ez-flame"}`}>{s.v}</p>
              <p className="text-xs text-ez-cream/65">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CIRI */}
      <section id="ciri" className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ez-red">Ciri Utama</p>
          <h2 className={`${display} mt-2 text-4xl font-extrabold uppercase italic sm:text-5xl`}>Semua dalam satu sistem</h2>
          <p className="mt-2 text-black/60 dark:text-white/60">Pengurusan kokurikulum yang lengkap, automatik dan telus untuk pelajar, guru dan pentadbir.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CIRI.map((c) => (
            <Reveal key={c.tajuk}>
              <div className="group h-full rounded-lg border-2 border-ez-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:border-ez-red dark:border-white/10 dark:bg-ez-ink-2 dark:hover:border-ez-flame">
                <div className="flex h-11 w-11 -skew-x-12 items-center justify-center rounded-md bg-ez-ink text-ez-amber transition group-hover:bg-ez-red group-hover:text-white dark:bg-white/10">
                  <span className="skew-x-12"><Ikon n={c.ikon} /></span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{c.tajuk}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-black/60 dark:text-white/65">{c.teks}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PERANAN */}
      <section id="peranan" className="bg-white py-20 dark:bg-ez-ink-2/50">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ez-red">Untuk Setiap Peranan</p>
            <h2 className={`${display} mt-2 text-4xl font-extrabold uppercase italic sm:text-5xl`}>Tiga pasukan, satu matlamat</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {PERANAN.map((p) => (
              <Reveal key={p.tajuk}>
                <div className="h-full overflow-hidden rounded-lg ring-2 ring-ez-ink/10 dark:ring-white/10">
                  <div className={`${p.band} relative overflow-hidden px-6 py-5 text-white`}>
                    <div aria-hidden className="ez-slash -right-6 top-0 flex h-full gap-1.5 opacity-30">
                      <i className="w-6 bg-white" /><i className="w-3 bg-white" />
                    </div>
                    <h3 className={`${display} relative text-3xl font-extrabold uppercase italic`}>{p.tajuk}</h3>
                  </div>
                  <p className="bg-ez-paper p-6 text-sm leading-relaxed text-black/65 dark:bg-ez-ink-2 dark:text-white/70">{p.teks}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALIRAN */}
      <section id="aliran" className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ez-red">Aliran Kerja</p>
          <h2 className={`${display} mt-2 text-4xl font-extrabold uppercase italic sm:text-5xl`}>5 fasa, satu sistem</h2>
        </Reveal>
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FASA.map((f, i) => (
            <Reveal key={f.t}>
              <li className="relative h-full rounded-lg bg-ez-ink p-5 text-ez-cream dark:bg-ez-ink-2 dark:ring-1 dark:ring-white/10">
                <span className={`${display} text-5xl font-extrabold italic leading-none ez-flame-text`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-bold">{f.t}</h3>
                <p className="text-sm text-ez-cream/60">{f.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-20 dark:bg-ez-ink-2/50">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ez-red">Soalan Lazim</p>
            <h2 className={`${display} mt-2 text-4xl font-extrabold uppercase italic sm:text-5xl`}>Ada soalan?</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <Reveal key={f.s}>
                <details className="group rounded-lg border-2 border-ez-ink/10 bg-ez-paper p-4 open:border-ez-red dark:border-white/10 dark:bg-ez-ink-2 dark:open:border-ez-flame">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {f.s}
                    <span className="ml-3 text-xl font-bold text-ez-red transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-black/65 dark:text-white/70">{f.j}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-ez-red via-ez-flame to-ez-amber">
        <div aria-hidden className="ez-slash -left-10 top-0 flex h-full gap-3 opacity-25">
          <i className="w-20 bg-ez-ink" /><i className="w-8 bg-ez-ink" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center text-white">
          <h2 className={`${display} text-5xl font-extrabold uppercase italic drop-shadow`}>Sedia untuk bermula?</h2>
          <p className="max-w-xl font-medium text-white/90">Log masuk dengan No. Kad Pengenalan (pelajar) atau emel berdaftar (guru dan pentadbir).</p>
          <Link href="/login" className={`${display} mt-2 rounded-md bg-ez-ink px-8 py-3 text-lg font-bold uppercase tracking-wide text-ez-cream shadow-xl transition hover:-translate-y-0.5 hover:bg-black`}>
            Log Masuk Sekarang →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ez-ink text-ez-cream/65">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo-ezkoko.webp" alt="" width={32} height={34} className="h-8 w-auto" />
            <span className={`${display} text-lg font-extrabold uppercase italic text-ez-cream`}>EzKoko<span className="text-ez-red">T6</span></span>
          </div>
          <p className="text-center text-xs">{institusi} · Sistem Pengurusan Kokurikulum Tingkatan 6</p>
          <p className="text-xs">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
