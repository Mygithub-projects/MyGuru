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

  async function act(url: string, body: Record<string, unknown>, key: string) {
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
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(null);
    }
  }

  const kosong =
    pencapaian.length === 0 &&
    aktivitiLuar.length === 0 &&
    pertukaran.length === 0 &&
    laporanMingguan.length === 0 &&
    laporanProjek.length === 0 &&
    sesiKehadiran.length === 0 &&
    cadanganJawatan.length === 0;

  return (
    <div className="space-y-5">
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
      {pertukaran.length > 0 && (
        <Section title={`${t.unitTransferTitle} (${pertukaran.length})`}>
          {pertukaran.map((p) => (
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
                onClick={() => act(`/api/tukar-unit/${p.id}`, { status: "Approved" }, `tukar-${p.id}-a`)}
              />
              <Btn
                label={t.reject}
                tone="danger"
                loading={busy === `tukar-${p.id}-r`}
                onClick={() => {
                  const sebab = prompt(t.rejectReasonPrompt) ?? undefined;
                  act(`/api/tukar-unit/${p.id}`, { status: "Reject", sebab }, `tukar-${p.id}-r`);
                }}
              />
            </Row>
          ))}
        </Section>
      )}

      {/* Cadangan Jawatan */}
      {cadanganJawatan.length > 0 && (
        <Section title={`${t.positionSuggestionTitle} (${cadanganJawatan.length})`}>
          {cadanganJawatan.map((c) => (
            <Row
              key={c.id}
              nama={c.pelajar.nama}
              kelas={c.pelajar.kelasT6}
              tajuk={`${c.jenisKoko}: ${c.jawatanBaru} (${c.markahJawatan} ${t.marksPlaceholder.toLowerCase()})`}
            >
              <Btn label={t.confirm} tone="ok" loading={busy === `jw-${c.id}-a`}
                onClick={() => act(`/api/jawatan/${c.id}`, { status: "Approved" }, `jw-${c.id}-a`)} />
              <Btn label={t.reject} tone="danger" loading={busy === `jw-${c.id}-r`}
                onClick={() => { const komen = prompt(t.rejectReasonPrompt) ?? undefined; act(`/api/jawatan/${c.id}`, { status: "Reject", komen }, `jw-${c.id}-r`); }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Pencapaian */}
      {pencapaian.length > 0 && (
        <Section title={`${t.achievementTitle} (${pencapaian.length})`}>
          {pencapaian.map((p) => (
            <PencapaianRow key={p.id} item={p} busy={busy} act={act} t={t} />
          ))}
        </Section>
      )}

      {/* Aktiviti Luar */}
      {aktivitiLuar.length > 0 && (
        <Section title={`${t.externalActivityTitle} (${aktivitiLuar.length})`}>
          {aktivitiLuar.map((a) => {
            const lengkap = a.lampiranSurat && a.lampiranSijil;
            return (
              <Row
                key={a.id}
                nama={a.pelajar.nama}
                kelas={a.pelajar.kelasT6}
                tajuk={`${a.namaAktiviti} · ${a.peringkat}`}
                nota={lengkap ? t.evidenceComplete : t.evidenceIncomplete}
              >
                <Btn
                  label={t.confirm}
                  tone="ok"
                  disabled={!lengkap}
                  loading={busy === `akt-${a.id}-a`}
                  onClick={() => act(`/api/aktiviti-luar/${a.id}/sahkan`, { status: "Approved" }, `akt-${a.id}-a`)}
                />
                <Btn
                  label={t.query}
                  tone="warn"
                  loading={busy === `akt-${a.id}-k`}
                  onClick={() => {
                    const komen = prompt(t.queryCommentPrompt) ?? undefined;
                    act(`/api/aktiviti-luar/${a.id}/sahkan`, { status: "Kuiri", komen }, `akt-${a.id}-k`);
                  }}
                />
              </Row>
            );
          })}
        </Section>
      )}

      {/* Laporan Mingguan */}
      {laporanMingguan.length > 0 && (
        <Section title={`${t.weeklyReportTitle} (${laporanMingguan.length})`}>
          {laporanMingguan.map((l) => (
            <Row key={l.id} nama={l.setiausaha.nama} kelas={l.setiausaha.kelasT6} tajuk={l.tajuk}>
              <Btn label={t.confirm} tone="ok" loading={busy === `lm-${l.id}-a`}
                onClick={() => act(`/api/laporan/mingguan/${l.id}/sahkan`, { status: "Approved" }, `lm-${l.id}-a`)} />
              <Btn label={t.query} tone="warn" loading={busy === `lm-${l.id}-k`}
                onClick={() => { const komen = prompt(t.queryCommentPrompt) ?? undefined; act(`/api/laporan/mingguan/${l.id}/sahkan`, { status: "Kuiri", komen }, `lm-${l.id}-k`); }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Laporan Projek */}
      {laporanProjek.length > 0 && (
        <Section title={`${t.projectReportTitle} (${laporanProjek.length})`}>
          {laporanProjek.map((l) => (
            <Row key={l.id} nama={l.setiausaha.nama} kelas={l.setiausaha.kelasT6} tajuk={l.tajuk}>
              <Btn label={t.confirm} tone="ok" loading={busy === `lp-${l.id}-a`}
                onClick={() => act(`/api/laporan/projek/${l.id}/sahkan`, { status: "Approved" }, `lp-${l.id}-a`)} />
              <Btn label={t.query} tone="warn" loading={busy === `lp-${l.id}-k`}
                onClick={() => { const komen = prompt(t.queryCommentPrompt) ?? undefined; act(`/api/laporan/projek/${l.id}/sahkan`, { status: "Kuiri", komen }, `lp-${l.id}-k`); }} />
            </Row>
          ))}
        </Section>
      )}

      {/* Sesi Kehadiran */}
      {sesiKehadiran.length > 0 && (
        <Section title={`${t.attendanceSessionTitle} (${sesiKehadiran.length})`}>
          {sesiKehadiran.map((s) => (
            <Row key={s.id} nama={s.namaUnit} kelas={null} tajuk={`${s.jenisKoko}: ${s.namaUnit} — Perjumpaan ${s.bilPerjumpaan}`}>
              <Btn label={t.confirm} tone="ok" loading={busy === `sk-${s.id}`}
                onClick={() => act(`/api/kehadiran/sesi/${s.id}/sahkan`, {}, `sk-${s.id}`)} />
            </Row>
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
}: {
  item: Pencapaian;
  busy: string | null;
  act: (url: string, body: Record<string, unknown>, key: string) => void;
  t: ReviewPanelDict;
}) {
  // Pra-isi dengan markah yang dicadang AI (ikut peringkat). Guru boleh laras.
  const [markah, setMarkah] = useState(item.markahCadangan > 0 ? String(item.markahCadangan) : "");
  return (
    <Row
      nama={item.pelajar.nama}
      kelas={item.pelajar.kelasT6}
      tajuk={item.namaPencapaian}
      nota={[item.kategori, item.peringkat].filter(Boolean).join(" · ") || undefined}
    >
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
        loading={busy === `pen-${item.id}-a`}
        onClick={() =>
          act(
            `/api/pencapaian/${item.id}/sahkan`,
            { status: "Approved", markah: markah ? Number(markah) : item.markahCadangan },
            `pen-${item.id}-a`
          )
        }
      />
      <Btn
        label={t.query}
        tone="warn"
        loading={busy === `pen-${item.id}-k`}
        onClick={() => {
          const komen = prompt(t.queryCommentPrompt) ?? undefined;
          act(`/api/pencapaian/${item.id}/sahkan`, { status: "Kuiri", komen }, `pen-${item.id}-k`);
        }}
      />
    </Row>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
}: {
  nama: string;
  kelas: string | null;
  tajuk: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
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
}: {
  label: string;
  tone: "ok" | "warn" | "danger";
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
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
      className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition ${tones[tone]} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {loading ? "..." : label}
    </button>
  );
}
