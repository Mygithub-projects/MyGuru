import Image from "next/image";
import Link from "next/link";
import { Reveal, ThemeToggle } from "./LandingClient";

const CIRI = [
  { ikon: "📊", tajuk: "Markah PAJSK Automatik", teks: "Pengiraan markah kehadiran, jawatan, penglibatan, pencapaian & projek secara automatik mengikut formula PAJSK rasmi — tiada kira manual, sifar ralat." },
  { ikon: "🔄", tajuk: "Pendaftaran & Pertukaran Unit", teks: "Pelajar daftar atau tukar unit Kelab/Sukan/Badan Beruniform; guru penasihat meluluskan. Jawatan & markah dikemas kini secara automatik." },
  { ikon: "🎓", tajuk: "e-Cert & Butiran Diri", teks: "Sijil PDF rasmi dengan No. Siri unik dan butiran diri lengkap — dijana sendiri oleh pelajar selepas pengesahan." },
  { ikon: "✨", tajuk: "Analitik Pintar (AI)", teks: "Cerapan berasaskan data + ringkasan jana-AI: tren kehadiran, status pilihan T6, dan cadangan tindakan untuk pentadbir." },
  { ikon: "📱", tajuk: "Kehadiran QR", teks: "Setiausaha buka sesi perjumpaan; ahli imbas kod QR untuk hadir sendiri. Markah kehadiran dikemas kini serta-merta." },
  { ikon: "🔐", tajuk: "Selamat & Patuh PDPA", teks: "Akses berperingkat (Pelajar/Guru/Admin + SU/NSU), kata laluan ter-enkripsi, dan rahsia diurus dengan selamat." },
];

const PERANAN = [
  { ikon: "🧑‍🎓", tajuk: "Pelajar", teks: "Lihat profil & pecahan markah PAJSK, isi pencapaian & aktiviti luar, mohon tukar unit, dan cetak e-Cert.", warna: "bg-brand" },
  { ikon: "👩‍🏫", tajuk: "Guru", teks: "Pantau unit seliaan, sahkan/kuiri laporan & pencapaian, luluskan pertukaran, dan lihat analitik.", warna: "bg-ink dark:bg-brand-dark" },
  { ikon: "🏛️", tajuk: "Pentadbir", teks: "Import data, konfigur formula markah & templat sijil, urus demografi, dan analitik seluruh kohort.", warna: "bg-brand" },
];

const FASA = [
  { n: "1", t: "Integrasi Data", d: "Import data pelajar & guru" },
  { n: "2", t: "Setiausaha", d: "Laporan & kehadiran" },
  { n: "3", t: "Pengiraan", d: "Markah automatik" },
  { n: "4", t: "Aktiviti & Sijil", d: "Eviden → e-Cert" },
  { n: "5", t: "Semakan Guru", d: "Sahkan & notifikasi" },
];

const FAQ = [
  { s: "Bagaimana pelajar log masuk?", j: "Menggunakan No. Kad Pengenalan sebagai ID. Kata laluan lalai wajib ditukar pada log masuk pertama." },
  { s: "Adakah markah PAJSK dikira secara automatik?", j: "Ya — kehadiran (50), jawatan, penglibatan, pencapaian & projek (100 markah) serta ekstra kurikulum (bonus) dikira mengikut formula PAJSK rasmi. Admin boleh konfigur nilai mengikut pekeliling semasa." },
  { s: "Bagaimana gred ditentukan?", j: "Gred berdasarkan jumlah markah daripada 100: A (80–100), B (60–79.9), C (40–59.9), D (20–39.9), E (≤19.9)." },
  { s: "Bolehkah pelajar cetak sijil sendiri?", j: "Ya. e-Cert PDF rasmi dengan No. Siri unik dijana sendiri oleh pelajar selepas aktiviti disahkan oleh guru." },
  { s: "Adakah ia selamat dan mematuhi PDPA?", j: "Ya — akses berperingkat, kata laluan ter-enkripsi (bcrypt), HTTPS, dan rahsia diurus melalui environment variables." },
  { s: "Perlukah pemasangan?", j: "Tidak. Sistem berasaskan web dan berfungsi pada telefon, tablet, dan komputer tanpa pemasangan." },
];

export function Landing({ institusi }: { institusi: string }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background dark:bg-ink">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-ink/80">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Image src="/logo-ktedm.jpeg" alt="Logo" width={36} height={36} className="rounded-full ring-1 ring-slate-200 dark:ring-white/20" />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink dark:text-white">KoKurikulum</p>
            <p className="hidden text-[11px] text-slate-500 dark:text-white/60 sm:block">{institusi}</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-white/70 md:flex">
            <a href="#ciri" className="hover:text-brand-dark dark:hover:text-white">Ciri</a>
            <a href="#peranan" className="hover:text-brand-dark dark:hover:text-white">Peranan</a>
            <a href="#aliran" className="hover:text-brand-dark dark:hover:text-white">Aliran</a>
            <a href="#faq" className="hover:text-brand-dark dark:hover:text-white">FAQ</a>
          </nav>
          <ThemeToggle />
          <Link href="/login" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover">
            Log Masuk
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-ink-2 to-brand-dark text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-white/20">
              ✨ AI-POWERED · DATA-DRIVEN
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Sistem Pengurusan <span className="text-blue-300">Kokurikulum</span> Tingkatan 6
            </h1>
            <p className="mt-4 max-w-lg text-lg text-white/80">
              Menggantikan fail fizikal, mengautomasi markah PAJSK, dan memperkasa kepimpinan
              pelajar Tingkatan 6 — selamat, mesra mudah alih, dan mematuhi PDPA.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-hover">
                Log Masuk →
              </Link>
              <a href="#ciri" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20">
                Lihat Ciri
              </a>
            </div>
          </Reveal>

          {/* Mock dashboard preview */}
          <Reveal className="relative">
            <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-2xl ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Markah PAJSK T6</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Gred B</span>
              </div>
              <p className="text-4xl font-bold text-ink">68<span className="text-lg text-slate-400"> / 100</span></p>
              <p className="text-xs text-slate-400">68.00% · Kelab Komputer · Setiausaha</p>
              <div className="mt-4 space-y-2">
                {[["Kehadiran", 96], ["Jawatan", 70], ["Penglibatan", 80], ["Pencapaian", 60]].map(([l, w]) => (
                  <div key={l as string}>
                    <div className="mb-0.5 flex justify-between text-[11px] text-slate-500"><span>{l}</span><span>{w}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${w}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl bg-ink px-4 py-3 text-white shadow-xl ring-1 ring-white/10 sm:block">
              <p className="text-[10px] uppercase tracking-wide text-white/60">Kehadiran purata</p>
              <p className="text-xl font-bold">92%</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-ink-2">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[["Tanpa Kertas", "100%"], ["Pengiraan Markah", "Automatik"], ["Sijil", "Self-Service"], ["Akses", "3 Peringkat"]].map(([l, v]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-bold text-ink dark:text-white">{v}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CIRI */}
      <section id="ciri" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Ciri Utama</p>
          <h2 className="mt-2 text-3xl font-bold text-ink dark:text-white">Semua yang anda perlukan</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500 dark:text-white/60">Satu platform untuk pengurusan kokurikulum yang lengkap, automatik, dan telus.</p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CIRI.map((c) => (
            <Reveal key={c.tajuk}>
              <div className="h-full rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand/30 dark:bg-ink-2 dark:ring-white/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-light text-xl dark:bg-white/10">{c.ikon}</div>
                <h3 className="mt-4 font-bold text-ink dark:text-white">{c.tajuk}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-white/70">{c.teks}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PERANAN */}
      <section id="peranan" className="bg-white py-16 dark:bg-ink">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Untuk Setiap Peranan</p>
            <h2 className="mt-2 text-3xl font-bold text-ink dark:text-white">Direka untuk semua pengguna</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {PERANAN.map((p) => (
              <Reveal key={p.tajuk}>
                <div className="h-full overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-white/10">
                  <div className={`${p.warna} p-6 text-white`}>
                    <div className="text-3xl">{p.ikon}</div>
                    <h3 className="mt-2 text-xl font-bold">{p.tajuk}</h3>
                  </div>
                  <p className="bg-white p-6 text-sm leading-relaxed text-slate-600 dark:bg-ink-2 dark:text-white/70">{p.teks}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALIRAN */}
      <section id="aliran" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Aliran Kerja</p>
          <h2 className="mt-2 text-3xl font-bold text-ink dark:text-white">5 fasa, satu sistem</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {FASA.map((f) => (
            <Reveal key={f.n}>
              <div className="rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 dark:bg-ink-2 dark:ring-white/10">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{f.n}</div>
                <h3 className="mt-3 text-sm font-bold text-ink dark:text-white">{f.t}</h3>
                <p className="text-xs text-slate-500 dark:text-white/60">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-16 dark:bg-ink">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Soalan Lazim</p>
            <h2 className="mt-2 text-3xl font-bold text-ink dark:text-white">Ada soalan?</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <Reveal key={f.s}>
                <details className="group rounded-xl bg-background p-4 ring-1 ring-slate-200 dark:bg-ink-2 dark:ring-white/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink dark:text-white">
                    {f.s}
                    <span className="ml-3 text-brand transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{f.j}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-ink to-brand">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">Sedia untuk bermula?</h2>
          <p className="max-w-xl text-white/80">Log masuk menggunakan No. Kad Pengenalan (pelajar) atau emel berdaftar (guru/admin).</p>
          <Link href="/login" className="mt-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-slate-100">
            Log Masuk Sekarang →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink-2 text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo-ktedm.jpeg" alt="Logo" width={28} height={28} className="rounded-full" />
            <span className="text-sm font-semibold text-white">KoKurikulum</span>
          </div>
          <p className="text-center text-xs">{institusi} · Sistem Pengurusan Kokurikulum Tingkatan 6</p>
          <p className="text-xs">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
