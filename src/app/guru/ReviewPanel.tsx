"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ItemPelajar {
  pelajar: { nama: string; kelasT6: string | null };
}
interface Pencapaian extends ItemPelajar {
  id: string;
  namaPencapaian: string;
  kategori: string | null;
  peringkat: string | null;
  markahCadangan: number; // dicadang AI ikut peringkat (rubrik §5.5)
  lampiranEviden?: string | null;
}
interface AktivitiLuar extends ItemPelajar {
  id: string;
  namaAktiviti: string;
  peringkat: string;
  lampiranSurat: string | null;
  lampiranSijil: string | null;
}
interface Pertukaran extends ItemPelajar {
  id: string;
  jenisKoko: string;
  unitLama: string | null;
  unitBaru: string;
  sebab: string | null;
}
interface Laporan {
  id: string;
  tajuk: string;
  setiausaha: { nama: string; kelasT6: string | null };
}
interface Sesi {
  id: string;
  namaUnit: string;
  jenisKoko: string;
  bilPerjumpaan: number;
  kehadiran?: { statusHadir: boolean; pelajar: { nama: string; kelasT6: string | null } }[];
}
interface Cadangan extends ItemPelajar {
  id: string;
  jenisKoko: string;
  jawatanBaru: string;
  markahJawatan: number;
}
interface ReviewPanelDict {
  networkError: string; emptyAll: string;
  unitTransferTitle: string; positionSuggestionTitle: string; achievementTitle: string;
  externalActivityTitle: string; attendanceSessionTitle: string;
  weeklyReportTitle: string; projectReportTitle: string;
  approve: string; reject: string; confirm: string; query: string;
  rejectReasonPrompt: string; queryCommentPrompt: string;
  evidenceComplete: string; evidenceIncomplete: string; marksPlaceholder: string;
  aiSuggestTitle: string;
  viewEvidence: string; viewLetter: string; viewCert: string; noEvidence: string;
  viewAttendance: string; hideAttendance: string; present: string; absent: string; meeting: string;
  reviewFirst: string;
}

export function ReviewPanel({
  pencapaian,
  aktivitiLuar,
  pertukaran,
  laporanMingguan = [],
  laporanProjek = [],
  sesiKehadiran = [],
  cadanganJawatan = [],
  t,
}: {
  pencapaian: Pencapaian[];
  aktivitiLuar: AktivitiLuar[];
  pertukaran: Pertukaran[];
  laporanMingguan?: Laporan[];
  laporanProjek?: Laporan[];
  sesiKehadiran?: Sesi[];
  cadanganJawatan?: Cadangan[];
  t: ReviewPanelDict;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Senarai disimpan sebagai state tempatan supaya baris boleh dibuang serta-merta
  // selepas tindakan berjaya, tanpa menunggu router.refresh() selesai.
  const [pencapaianList, setPencapaianList] = useState(pencapaian);
  const [aktivitiLuarList, setAktivitiLuarList] = useState(aktivitiLuar);
  const [pertukaranList, setPertukaranList] = useState(pertukaran);
  const [laporanMingguanList, setLaporanMingguanList] = useState(laporanMingguan);
  const [laporanProjekList, setLaporanProjekList] = useState(laporanProjek);
  const [sesiKehadiranList, setSesiKehadiranList] = useState(sesiKehadiran);
  const [cadanganJawatanList, setCadanganJawatanList] = useState(cadanganJawatan);



  async function act(url: string, body: Record<string, unknown>, key: string): Promise<boolean> {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) router.refresh();
      return json.success;
    } catch {
      setMsg({ text: t.networkError, ok: false });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const kosong =
    pencapaianList.length === 0 &&
    aktivitiLuarList.length === 0 &&
    pertukaranList.length === 0 &&
    laporanMingguanList.length === 0 &&
    laporanProjekList.length === 0 &&
    sesiKehadiranList.length === 0 &&
    cadanganJawatanList.length === 0;

  return (
    <div id="review-panel" className="space-y-5 scroll-mt-4">
      {msg && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {kosong && (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {t.emptyAll}
        </div>
      )}

      {/* Pertukaran Unit */}
      {pertukaranList.length > 0 && (
        <Section id="review-pertukaran" title={`${t.unitTransferTitle} (${pertukaranList.length})`}>
          {pertukaranList.map((p) => (
            <Row
              key={p.id}
              nama={p.pelajar.nama}
              kelas={p.pelajar.kelasT6}
              tajuk={`${p.jenisKoko}: ${p.unitLama ?? "-"} → ${p.unitBaru}`}
              nota={p.sebab ?? undefined}
            >
              <Btn
                label={t.approve}
                tone="ok"
                loading={busy === `tukar-${p.id}-a`}
                onClick={async () => {
                  const success = await act(`/api/tukar-unit/${p.id}`, { status: "Approved" }, `tukar-${p.id}-a`);
                  if (success) setPertukaranList((prev) => prev.filter((x) => x.id !== p.id));
                }}
              />
              <Btn
                label={t.reject}
                tone="danger"
                loading={busy === `tukar-${p.id}-r`}
                onClick={async () => {
                  const sebab = prompt(t.rejectReasonPrompt) ?? undefined;
                  const success = await act(`/api/tukar-unit/${p.id}`, { status: "Reject", sebab }, `tukar-${p.id}-r`);
                  if (success) setPertukaranList((prev) => prev.filter((x) => x.id !== p.id));
                }}
              />
            </Row>
          ))}
        </Section>
      )}

      {/* Cadangan Jawatan */}
      {cadanganJawatanList.length > 0 && (
        <Section id="review-cadanganJawatan" title={`${t.positionSuggestionTitle} (${cadanganJawatanList.length})`}>
          {cadanganJawatanList.map((c) => (
            <Row
              key={c.id}
              nama={c.pelajar.nama}
              kelas={c.pelajar.kelasT6}
              tajuk={`${c.jenisKoko}: ${c.jawatanBaru} (${c.markahJawatan} ${t.marksPlaceholder.toLowerCase()})`}
            >
              <Btn label={t.confirm} tone="ok" loading={busy === `jw-${c.id}-a`}
                onClick={async () => {
                  const success = await act(`/api/jawatan/${c.id}`, { status: "Approved" }, `jw-${c.id}-a`);
                  if (success) setCadanganJawatanList((prev) => prev.filter((x) => x.id !== c.id));
                }} />
              <Btn label={t.reject} tone="danger" loading={busy === `jw-${c.id}-r`}
                onClick={async () => {
                  const komen = prompt(t.rejectReasonPrompt) ?? undefined;
                  const success = await act(`/api/jawatan/${c.id}`, { status: "Reject", komen }, `jw-${c.id}-r`);
                  if (success) setCadanganJawatanList((prev) => prev.filter((x) => x.id !== c.id));
                }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Pencapaian */}
      {pencapaianList.length > 0 && (
        <Section id="review-pencapaian" title={`${t.achievementTitle} (${pencapaianList.length})`}>
          {pencapaianList.map((p) => (
            <PencapaianRow
              key={p.id}
              item={p}
              busy={busy}
              act={act}
              t={t}
              onDone={() => setPencapaianList((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))}
        </Section>
      )}

      {/* Aktiviti Luar */}
      {aktivitiLuarList.length > 0 && (
        <Section id="review-aktivitiLuar" title={`${t.externalActivityTitle} (${aktivitiLuarList.length})`}>
          {aktivitiLuarList.map((a) => (
            <AktivitiLuarRow
              key={a.id}
              item={a}
              busy={busy}
              act={act}
              t={t}
              onDone={() => setAktivitiLuarList((prev) => prev.filter((x) => x.id !== a.id))}
            />
          ))}
        </Section>
      )}

      {/* Laporan Mingguan */}
      {laporanMingguanList.length > 0 && (
        <Section id="review-laporanMingguan" title={`${t.weeklyReportTitle} (${laporanMingguanList.length})`}>
          {laporanMingguanList.map((l) => (
            <Row key={l.id} nama={l.setiausaha.nama} kelas={l.setiausaha.kelasT6} tajuk={l.tajuk}>
              <Btn label={t.confirm} tone="ok" loading={busy === `lm-${l.id}-a`}
                onClick={async () => {
                  const success = await act(`/api/laporan/mingguan/${l.id}/sahkan`, { status: "Approved" }, `lm-${l.id}-a`);
                  if (success) setLaporanMingguanList((prev) => prev.filter((x) => x.id !== l.id));
                }} />
              <Btn label={t.query} tone="warn" loading={busy === `lm-${l.id}-k`}
                onClick={async () => {
                  const komen = prompt(t.queryCommentPrompt) ?? undefined;
                  const success = await act(`/api/laporan/mingguan/${l.id}/sahkan`, { status: "Kuiri", komen }, `lm-${l.id}-k`);
                  if (success) setLaporanMingguanList((prev) => prev.filter((x) => x.id !== l.id));
                }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Laporan Projek */}
      {laporanProjekList.length > 0 && (
        <Section id="review-laporanProjek" title={`${t.projectReportTitle} (${laporanProjekList.length})`}>
          {laporanProjekList.map((l) => (
            <Row key={l.id} nama={l.setiausaha.nama} kelas={l.setiausaha.kelasT6} tajuk={l.tajuk}>
              <Btn label={t.confirm} tone="ok" loading={busy === `lp-${l.id}-a`}
                onClick={async () => {
                  const success = await act(`/api/laporan/projek/${l.id}/sahkan`, { status: "Approved" }, `lp-${l.id}-a`);
                  if (success) setLaporanProjekList((prev) => prev.filter((x) => x.id !== l.id));
                }} />
              <Btn label={t.query} tone="warn" loading={busy === `lp-${l.id}-k`}
                onClick={async () => {
                  const komen = prompt(t.queryCommentPrompt) ?? undefined;
                  const success = await act(`/api/laporan/projek/${l.id}/sahkan`, { status: "Kuiri", komen }, `lp-${l.id}-k`);
                  if (success) setLaporanProjekList((prev) => prev.filter((x) => x.id !== l.id));
                }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Sesi Kehadiran */}
      {sesiKehadiranList.length > 0 && (
        <Section id="review-sesiKehadiran" title={`${t.attendanceSessionTitle} (${sesiKehadiranList.length})`}>
          {sesiKehadiranList.map((s) => (
            <SesiRow
              key={s.id}
              item={s}
              busy={busy}
              act={act}
              t={t}
              onDone={() => setSesiKehadiranList((prev) => prev.filter((x) => x.id !== s.id))}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function PencapaianRow({
  item,
  busy,
  act,
  t,
  onDone,
}: {
  item: Pencapaian;
  busy: string | null;
  act: (url: string, body: Record<string, unknown>, key: string) => Promise<boolean>;
  t: ReviewPanelDict;
  onDone: () => void;
}) {
  // Pra-isi dengan markah yang dicadang AI (ikut peringkat). Guru boleh laras.
  const [markah, setMarkah] = useState(item.markahCadangan > 0 ? String(item.markahCadangan) : "");
  // Guru mesti buka eviden dahulu sebelum butang Sahkan aktif.
  const [dilihat, setDilihat] = useState(false);
  return (
    <Row
      nama={item.pelajar.nama}
      kelas={item.pelajar.kelasT6}
      tajuk={item.namaPencapaian}
      nota={[item.kategori, item.peringkat].filter(Boolean).join(" · ") || undefined}
    >
      {item.lampiranEviden ? (
        <EvidenLink href={item.lampiranEviden} label={t.viewEvidence} dilihat={dilihat} onLihat={() => setDilihat(true)} />
      ) : (
        <span className="text-xs font-semibold text-red-600">{t.noEvidence}</span>
      )}
      <span
        className="rounded bg-brand-light px-1.5 py-0.5 text-xs font-semibold text-brand-dark"
        title={t.aiSuggestTitle}
      >
        🤖 {item.markahCadangan}
      </span>
      <input
        type="number"
        min={0}
        max={50}
        value={markah}
        onChange={(e) => setMarkah(e.target.value)}
        placeholder={t.marksPlaceholder}
        title={t.aiSuggestTitle}
        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <Btn
        label={t.confirm}
        tone="ok"
        disabled={!dilihat}
        title={dilihat ? undefined : t.reviewFirst}
        loading={busy === `pen-${item.id}-a`}
        onClick={async () => {
          const success = await act(
            `/api/pencapaian/${item.id}/sahkan`,
            { status: "Approved", markah: markah ? Number(markah) : item.markahCadangan },
            `pen-${item.id}-a`
          );
          if (success) onDone();
        }}
      />
      <Btn
        label={t.query}
        tone="warn"
        loading={busy === `pen-${item.id}-k`}
        onClick={async () => {
          const komen = prompt(t.queryCommentPrompt) ?? undefined;
          const success = await act(`/api/pencapaian/${item.id}/sahkan`, { status: "Kuiri", komen }, `pen-${item.id}-k`);
          if (success) onDone();
        }}
      />
    </Row>
  );
}

function AktivitiLuarRow({
  item: a,
  busy,
  act,
  t,
  onDone,
}: {
  item: AktivitiLuar;
  busy: string | null;
  act: (url: string, body: Record<string, unknown>, key: string) => Promise<boolean>;
  t: ReviewPanelDict;
  onDone: () => void;
}) {
  const [suratDilihat, setSuratDilihat] = useState(false);
  const [sijilDilihat, setSijilDilihat] = useState(false);
  const lengkap = !!(a.lampiranSurat && a.lampiranSijil);
  const sedia = lengkap && suratDilihat && sijilDilihat;
  return (
    <Row
      nama={a.pelajar.nama}
      kelas={a.pelajar.kelasT6}
      tajuk={`${a.namaAktiviti} · ${a.peringkat}`}
      nota={lengkap ? t.evidenceComplete : t.evidenceIncomplete}
    >
      {a.lampiranSurat && (
        <EvidenLink href={a.lampiranSurat} label={t.viewLetter} dilihat={suratDilihat} onLihat={() => setSuratDilihat(true)} />
      )}
      {a.lampiranSijil && (
        <EvidenLink href={a.lampiranSijil} label={t.viewCert} dilihat={sijilDilihat} onLihat={() => setSijilDilihat(true)} />
      )}
      <Btn
        label={t.confirm}
        tone="ok"
        disabled={!sedia}
        title={sedia ? undefined : lengkap ? t.reviewFirst : t.evidenceIncomplete}
        loading={busy === `akt-${a.id}-a`}
        onClick={async () => {
          const success = await act(`/api/aktiviti-luar/${a.id}/sahkan`, { status: "Approved" }, `akt-${a.id}-a`);
          if (success) onDone();
        }}
      />
      <Btn
        label={t.query}
        tone="warn"
        loading={busy === `akt-${a.id}-k`}
        onClick={async () => {
          const komen = prompt(t.queryCommentPrompt) ?? undefined;
          const success = await act(`/api/aktiviti-luar/${a.id}/sahkan`, { status: "Kuiri", komen }, `akt-${a.id}-k`);
          if (success) onDone();
        }}
      />
    </Row>
  );
}

function SesiRow({
  item: s,
  busy,
  act,
  t,
  onDone,
}: {
  item: Sesi;
  busy: string | null;
  act: (url: string, body: Record<string, unknown>, key: string) => Promise<boolean>;
  t: ReviewPanelDict;
  onDone: () => void;
}) {
  // Eviden sesi = senarai kehadiran yang ditanda SU/NSU. Guru mesti buka dahulu.
  const [buka, setBuka] = useState(false);
  const [dilihat, setDilihat] = useState(false);
  const senarai = s.kehadiran ?? [];
  const hadir = senarai.filter((k) => k.statusHadir).length;
  return (
    <div className="rounded-lg border border-slate-100">
      <Row nama={s.namaUnit} kelas={null} tajuk={`${s.jenisKoko}: ${s.namaUnit} — ${t.meeting} ${s.bilPerjumpaan}`} bare>
        <button
          type="button"
          onClick={() => {
            setBuka((v) => !v);
            setDilihat(true);
          }}
          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
            dilihat ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-brand-dark ring-brand/40 hover:bg-brand-light"
          }`}
        >
          {dilihat && "✓ "}
          {buka ? t.hideAttendance : t.viewAttendance} ({hadir}/{senarai.length} {t.present})
        </button>
        <Btn
          label={t.confirm}
          tone="ok"
          disabled={!dilihat}
          title={dilihat ? undefined : t.reviewFirst}
          loading={busy === `sk-${s.id}`}
          onClick={async () => {
            const success = await act(`/api/kehadiran/sesi/${s.id}/sahkan`, {}, `sk-${s.id}`);
            if (success) onDone();
          }}
        />
      </Row>
      {buka && (
        <ul className="grid gap-x-4 gap-y-1 border-t border-slate-100 px-3 py-2 text-xs sm:grid-cols-2">
          {senarai.length === 0 && <li className="text-slate-400">—</li>}
          {senarai.map((k, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate text-slate-700">
                {k.pelajar.nama}
                {k.pelajar.kelasT6 ? <span className="text-slate-400"> · {k.pelajar.kelasT6}</span> : null}
              </span>
              <span className={k.statusHadir ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
                {k.statusHadir ? "✓" : t.absent}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EvidenLink({
  href,
  label,
  dilihat,
  onLihat,
}: {
  href: string;
  label: string;
  dilihat: boolean;
  onLihat: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onLihat}
      onAuxClick={onLihat}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
        dilihat ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-brand-dark ring-brand/40 hover:bg-brand-light"
      }`}
    >
      {dilihat && "✓ "}
      {label}
    </a>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  nama,
  kelas,
  tajuk,
  nota,
  children,
  bare,
}: {
  nama: string;
  kelas: string | null;
  tajuk: string;
  nota?: string;
  children: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 ${bare ? "" : "rounded-lg border border-slate-100"}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{tajuk}</p>
        <p className="text-xs text-slate-500">
          {nama}
          {kelas ? ` · ${kelas}` : ""}
          {nota ? ` · ${nota}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Btn({
  label,
  tone,
  onClick,
  loading,
  disabled,
  title,
}: {
  label: string;
  tone: "ok" | "warn" | "danger";
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const tones: Record<string, string> = {
    ok: "bg-brand hover:bg-brand-hover",
    warn: "bg-amber-500 hover:bg-amber-600",
    danger: "bg-red-600 hover:bg-red-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition ${tones[tone]} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {loading ? "..." : label}
    </button>
  );
}
