// ===========================================================================
//  i18n ringan (tanpa pustaka) — BM (ms) & English (en).
//  Modul ini TULEN (tiada next/headers) supaya selamat di client & server.
//  getLocale() (server, guna cookie) ada dalam ./locale.ts.
// ===========================================================================
export const LOCALE_COOKIE = "locale";
export const LOCALES = ["ms", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ms";
export function isLocale(v: unknown): v is Locale {
  return v === "ms" || v === "en";
}

export interface Dict {
  langName: { ms: string; en: string };
  common: {
    kelab: string; sukan: string; uniform: string;
    jawatan: string; peringkat: string; status: string;
    tingkatan5: string; tingkatan6: string; kembali: string; dashboard: string;
    muatTurun: string; disahkan: string; belumDisahkan: string; hadir: string; tidakHadir: string;
    tiadaData: string;
  };
  // Istilah rasmi komponen PAJSK (§1.1) — terjemahan EN tepat (§8).
  pajsk: {
    kehadiran: string; jawatan: string; penglibatan: string; pencapaian: string;
    projekJawatan: string; projekPeringkat: string; ekstra: string;
  };
  header: { roleStudent: string; roleTeacher: string; roleAdmin: string; help: string; logout: string; notifications: string; theme: string };
  login: {
    subtitle: string; heading: string; identifier: string; password: string;
    submit: string; submitting: string; loading: string; footer: string;
    failed: string; networkError: string;
  };
  pelajar: {
    welcome: string; icNo: string;
    linkAktiviti: string; linkKehadiran: string; linkLaporan: string; linkJawatan: string; linkButiran: string;
    scoreT6: string; systemComputed: string; pctT6: string; fullMarks100: string;
    gred: string; finalGrade: string;
    scoreT5: string; importedRecord: string; change: string; t5ToT6: string;
    marksByUnit: string; participationTotal: string; unitNote: string;
    attendanceTitle: string; present: string; sessionsRecorded: string; attendancePct: string;
    outOf30: string; attendanceMark: string; fullMarks40: string; pajskContribution: string; countedInT6: string;
    comparison: string; detail: string; marksByCategory: string;
    currentUnits: string; history: string; achievements: string;
    backToDashboard: string;
    activityTitle: string; activitySubtitle: string; activityTabs: { achievements: string; externalActivities: string };
    achievementSection: string; externalActivitiesSection: string;
    noRecords: string; commentLabel: string; generateECert: string; loading: string;
    activityForm: {
      achievementName: string; activityName: string; levelPlaceholder: string; dateLabel: string;
      evidenceLabel: string; letterLabel: string; certificateLabel: string; uploadEvidence: string;
      submit: string; submitToReview: string; reportPlaceholder: string; networkError: string; fileTooLarge: string;
      uploadSizeLimit: string; fetchError: string; noToken: string; cancel: string; loading: string;
    };
    attendancePageTitle: string; attendanceSubtitle: string; attendanceRestricted: string;
    attendancePanel: {
      openSessionTitle: string; unitLabel: string; meetingNumber: string; dateLabel: string;
      openSessionButton: string; saveAttendanceButton: string; memberListTitle: string; attendanceCount: string;
      attendanceQrTitle: string; attendanceQrInfo: string; noUnits: string; noToken: string; loading: string;
      recording: string; networkError: string;
    };
    reportPageTitle: string; reportPageSubtitle: string;
    reportTabs: { weekly: string; project: string };
    reportLinkSession: string; reportUploadPrompt: string; reportNoAttachment: string;
    reportSelectSessionPlaceholder: string; reportProjectOptionPrefix: string; reportNewProjectPlaceholder: string;
    reportTimePlaceholder: string; reportActivityPlaceholder: string; reportPaperLabel: string; reportImpactLabel: string;
    reportFinancePlaceholder: string; reportStrengthPlaceholder: string; reportWeaknessPlaceholder: string;
    reportSubmitReview: string; reportSubmit: string; reportNoRecords: string; reportAttendanceLabel: string; reportViewSession: string; reportAttachmentLabel: string;
    suNsuOnly: string; sessionLabel: string;
    transferTitle: string; transferSubtitle: string; transferCurrentUnits: string; transferHistory: string;
    transferFormTitle: string; transferTypeLabel: string; transferNewUnitLabel: string; transferReasonLabel: string;
    transferReasonPlaceholder: string; transferSubmit: string; transferPending: string; transferPendingNotice: string; transferNetworkError: string;
    transferCurrentUnit: string; transferRegister: string; transferChange: string; transferNoRequest: string;
    transferNoAdvisor: string; transferExample: string; transferWaitingNotice: string; transferConfirmReplace: string;
    transferApplyInfo: string; transferUnitsOnlyWithAdvisor: string; transferSelectUnitPlaceholder: string; transferUnitNotRegistered: string;
    scanPageTitle: string; scanLoading: string; scanNoToken: string; scanNetworkError: string; scanCheckinTitle: string; scanBack: string;
    positionTitle: string; positionSubtitle: string; positionRestricted: string; positionNoMembers: string;
    positionSuggest: string; positionPending: string; positionChoose: string; positionChooseFirst: string; positionCurrent: string;
    positionPendingHint: string; positionNoUnitFound: string; positionSelectPrompt: string;
    unitSectionTitle: string; unitHistoryLink: string; unitCurrentUnitLabel: string; unitNotRegistered: string;
    unitSwitch: string; unitRegister: string; unitChange: string; unitSelectPlaceholder: string; unitReasonLabel: string;
    unitNotes: string; unitNoAdvisorMessage: string; unitConfirmReplace: string; unitPendingNotice: string;
    unitDialogTitleRegister: string; unitDialogTitleChange: string;
    unitRequestSuccess: string; unitRequestPending: string; unitCancel: string; unitApplyInfo: string;
  };
  guru: {
    dashboardTitle: string; position: string; scopeSchool: string; scopeUnit: string;
    linkMembers: string; linkAttendance: string; linkAnalytics: string; linkSelection: string;
    cardStudents: string; cardPending: string; cardClub: string; cardSportBb: string;
    statusPilihan: string; noMembers: string;
    verifiedDocs: string; noVerifiedDocs: string; weekly: string; project: string;
    membersTitle: string; membersSub: string; unitCount: string; memberCount: string;
    colName: string; colClass: string; colCurrentPos: string; colMark: string; colSetPos: string; setPos: string;
    attendanceTitle: string; attendanceSub: string; noSessions: string; meeting: string; noAttendance: string;
  };
  admin: {
    dashboardTitle: string; students: string; teachers: string; userAccounts: string; kokoRecords: string;
    genderDist: string; noDemographics: string; male: string; female: string;
    quickActions: string;
    actManageStudents: string; actAddStudent: string; actAddTeacher: string; actImport: string;
    actFormula: string; actDemographics: string; actManageTeachers: string; actAttendance: string;
    actCertTemplate: string; actAnalytics: string; seeAlso: string; teacherView: string; studentView: string;
    pelajarTitle: string; pelajarSub: string; downloadAll: string;
    colUnits: string; colPajsk: string; colStatus: string; colActions: string; detail: string; edit: string;
  };
  laporan: {
    title: string; sub: string; weekly: string; project: string; noRecords: string; downloadVerified: string; comment: string;
    tabWeekly: string; tabProject: string; selectSessionOptional: string; newProjectOption: string; projectNamePlaceholder: string;
    workPlanLabel: string; impactReportLabel: string; financialSummaryPlaceholder: string; strengthPlaceholder: string; weaknessPlaceholder: string;
    submitForReview: string; networkError: string; loading: string; attachmentWorkPlan: string; attachmentImpactReport: string;
    reportTimePlaceholder: string; reportActivityPlaceholder: string; reportProjectOptionPrefix: string; reportUploadPrompt: string;
    sessionLabel: string; attachmentLabel: string; reportAttendanceLabel: string; reportViewSession: string; suNsuOnly: string;
  };
}

const ms: Dict = {
  langName: { ms: "BM", en: "EN" },
  common: {
    kelab: "Kelab/Persatuan", sukan: "Sukan", uniform: "Badan Beruniform",
    jawatan: "Jawatan", peringkat: "Peringkat", status: "Status",
    tingkatan5: "Tingkatan 5", tingkatan6: "Tingkatan 6", kembali: "Kembali", dashboard: "Dashboard",
    muatTurun: "Muat turun", disahkan: "Disahkan", belumDisahkan: "Belum Disahkan", hadir: "Hadir", tidakHadir: "Tidak Hadir",
    tiadaData: "Tiada data",
  },
  pajsk: {
    kehadiran: "Kehadiran", jawatan: "Jawatan", penglibatan: "Penglibatan", pencapaian: "Pencapaian",
    projekJawatan: "Projek — Jawatan", projekPeringkat: "Projek — Peringkat", ekstra: "Ekstra Kurikulum (bonus)",
  },
  header: { roleStudent: "Pelajar", roleTeacher: "Guru Penasihat", roleAdmin: "Pentadbir", help: "Bantuan", logout: "Log Keluar", notifications: "Notifikasi", theme: "Tukar mod terang/gelap" },
  login: {
    subtitle: "Sistem Pengurusan Kokurikulum Tingkatan 6", heading: "Log Masuk",
    identifier: "No. Kad Pengenalan", password: "Kata Laluan",
    submit: "Log Masuk", submitting: "Sedang log masuk...", loading: "Memuatkan...",
    footer: "Log masuk menggunakan No. Kad Pengenalan anda.",
    failed: "Gagal log masuk", networkError: "Ralat rangkaian. Sila cuba lagi.",
  },
  pelajar: {
    welcome: "Selamat Datang,", icNo: "No. IC:",
    linkAktiviti: "Pencapaian & Aktiviti", linkKehadiran: "Kehadiran", linkLaporan: "Laporan", linkJawatan: "Jawatan Ahli", linkButiran: "⬇ Butiran Diri (PDF)",
    scoreT6: "Markah PAJSK T6", systemComputed: "dikira sistem", pctT6: "Peratus T6", fullMarks100: "/ 100 markah penuh",
    gred: "Gred", finalGrade: "gred akhir (A–E)",
    scoreT5: "Markah PAJSK T5", importedRecord: "rekod import", change: "Perubahan", t5ToT6: "T5 → T6",
    marksByUnit: "Markah Mengikut Penyertaan (T6)", participationTotal: "Jumlah Penyertaan",
    unitNote: "Nota: markah keseluruhan (100) = Kehadiran + Jawatan + Penglibatan + Pencapaian + Projek; markah jawatan & penglibatan mengambil nilai tertinggi merentas unit.",
    attendanceTitle: "Kehadiran Perjumpaan (Setahun)", present: "Hadir", sessionsRecorded: "sesi direkod", attendancePct: "Peratus Kehadiran",
    outOf30: "atas 30 perjumpaan", attendanceMark: "Markah Kehadiran", fullMarks40: "/ 50 markah penuh", pajskContribution: "Sumbang PAJSK", countedInT6: "dikira dalam markah T6",
    comparison: "Perbandingan T5 vs T6", detail: "Butiran", marksByCategory: "Markah Mengikut Kategori",
    currentUnits: "Unit Kokurikulum Semasa (T6)", history: "Sejarah", achievements: "Pencapaian & Ekstra Kurikulum",
    backToDashboard: "← Kembali ke Dashboard",
    activityTitle: "Pencapaian & Aktiviti Luar", activitySubtitle: "Hantar pencapaian & aktiviti luar, muat naik bukti (surat/sijil), kemudian tunggu kelulusan guru.",
    activityTabs: { achievements: "Pencapaian", externalActivities: "Aktiviti Luar" },
    achievementSection: "Pencapaian", externalActivitiesSection: "Aktiviti Luar",
    noRecords: "Tiada rekod lagi.", commentLabel: "Komen", generateECert: "⬇ Terbitkan e-Sijil (PDF)",
    activityForm: {
      achievementName: "Nama pencapaian", activityName: "Nama aktiviti luar", levelPlaceholder: "— Peringkat —", dateLabel: "Tarikh",
      evidenceLabel: "Bukti (sijil/surat)", letterLabel: "Surat", certificateLabel: "Sijil", uploadEvidence: "⬆ Muat naik bukti (surat & sijil)",
      submit: "Hantar", submitToReview: "Hantar untuk Semakan", reportPlaceholder: "Aktiviti / laporan ringkas", networkError: "Ralat rangkaian", fileTooLarge: "Fail terlalu besar. Had muat naik 4MB — sila mampatkan atau kecilkan saiz.",
      uploadSizeLimit: "Fail terlalu besar untuk pelayan (had 4.5MB). Sila kecilkan fail.", fetchError: "Ralat pelayan. Sila cuba lagi atau hubungi guru anda.", noToken: "Tiada token. Sila imbas QR sah.", cancel: "Batal", loading: "Memuatkan...",
    },
    attendancePageTitle: "Kehadiran Ahli", attendanceSubtitle: "Buka sesi perjumpaan, tanda kehadiran ahli melalui senarai, atau paparkan QR untuk imbas sendiri.", attendanceRestricted: "Modul kehadiran hanya untuk Setiausaha (SU) / Naib Setiausaha (NSU). Sila hubungi guru penasihat anda jika anda sepatutnya mempunyai akses.",
    attendancePanel: {
      openSessionTitle: "Buka Sesi Perjumpaan", unitLabel: "Unit", meetingNumber: "Perjumpaan #", dateLabel: "Tarikh",
      openSessionButton: "Buka Sesi", saveAttendanceButton: "Simpan Kehadiran", memberListTitle: "Senarai Ahli", attendanceCount: "hadir",
      attendanceQrTitle: "Imbas QR Kehadiran", attendanceQrInfo: "Ahli boleh imbas kod ini (log masuk diperlukan) untuk menanda diri hadir.",
      noUnits: "Tiada unit dengan ahli ditemui untuk akaun anda.", noToken: "Tiada token. Sila imbas QR sah.", loading: "Merekod kehadiran...", recording: "Sesi dibuka. Tandakan kehadiran atau tunjukkan QR.", networkError: "Ralat rangkaian.",
    },
    reportPageTitle: "Laporan SU/NSU", reportPageSubtitle: "Laporan mingguan & projek, dipaut terus ke sesi kehadiran berkaitan.",
    reportTabs: { weekly: "Laporan Mingguan", project: "Laporan Projek" }, reportLinkSession: "Lihat sesi →", reportUploadPrompt: "Pra-program: muat naik Kertas Kerja. Pasca-program: pilih projek di atas + muat naik Laporan Impak & isi maklumat.", reportNoAttachment: "Tiada rekod lagi.",
    reportSelectSessionPlaceholder: "— Paut sesi kehadiran (pilihan) —", reportProjectOptionPrefix: "Pasca: ", reportNewProjectPlaceholder: "— Projek baharu (pra-program) —",
    reportTimePlaceholder: "Masa (cth 2.30-4.30 ptg)", reportActivityPlaceholder: "Aktiviti / laporan ringkas", reportPaperLabel: "Kertas Kerja (pra)", reportImpactLabel: "Laporan Impak (pasca)", reportFinancePlaceholder: "Ringkasan kewangan (RM)", reportStrengthPlaceholder: "Kekuatan", reportWeaknessPlaceholder: "Kelemahan / penambahbaikan", reportSubmitReview: "Hantar untuk Semakan", reportSubmit: "Hantar", reportNoRecords: "Tiada rekod lagi.", reportAttendanceLabel: "Kehadiran", reportViewSession: "Lihat sesi →", reportAttachmentLabel: "· 📎 lampiran", loading: "Sedang memuat...", suNsuOnly: "Hanya untuk SU / NSU.", sessionLabel: "Perjumpaan",
    transferTitle: "Pertukaran Unit Kokurikulum", transferSubtitle: "Mohon tukar Kelab/Sukan/Badan Beruniform. Unit dikemas kini selepas guru meluluskan.", transferCurrentUnits: "Unit Semasa (T6)", transferHistory: "Sejarah Permohonan",
    transferFormTitle: "Borang Permohonan Pertukaran", transferTypeLabel: "Jenis Kokurikulum", transferNewUnitLabel: "Unit Baru", transferReasonLabel: "Sebab (pilihan)",
    transferReasonPlaceholder: "cth: konflik jadual", transferSubmit: "Hantar Permohonan", transferPending: "Permohonan sedang menunggu kelulusan", transferPendingNotice: "Anda perlu menunggu keputusan permohonan semasa sebelum menghantar lagi.", transferNetworkError: "Ralat rangkaian.",
    transferCurrentUnit: "Unit semasa:", transferRegister: "Daftar", transferChange: "Tukar", transferNoRequest: "Tiada permohonan lagi.", transferNoAdvisor: "Tiada penasihat ditetapkan untuk kategori ini. Sila hubungi pentadbir.", transferExample: "cth: konflik jadual", transferWaitingNotice: "Sila tunggu kelulusan guru sebelum memohon lagi.", transferConfirmReplace: "Saya faham unit semasa akan diganti dan jawatan akan diset semula kepada 'Ahli Aktif' selepas diluluskan.", transferApplyInfo: "Mohon pertukaran unit anda dan tunggu kelulusan guru.", transferUnitsOnlyWithAdvisor: "Hanya unit dengan guru penasihat disenaraikan.", transferSelectUnitPlaceholder: "— Pilih unit —", transferUnitNotRegistered: "Belum berdaftar",
    scanPageTitle: "Check-in Kehadiran", scanLoading: "Memuatkan...", scanNoToken: "Tiada token. Sila imbas QR sah.", scanNetworkError: "Ralat rangkaian.", scanCheckinTitle: "Check-in Kehadiran", scanBack: "← Kembali",
    positionTitle: "Jawatan Ahli (T6)", positionSubtitle: "Cadangkan jawatan tertinggi ahli unit. Cadangan dihantar untuk pengesahan guru sebelum markah PAJSK dikemas kini.", positionRestricted: "Penetapan jawatan ahli hanya untuk Setiausaha (SU) / Naib Setiausaha (NSU).", positionNoMembers: "Tiada ahli unit ditemui.", positionSuggest: "Cadang", positionPending: "Menunggu", positionChoose: "— Pilih jawatan —", positionChooseFirst: "Sila pilih jawatan dahulu.", positionCurrent: "Jawatan semasa:", positionPendingHint: "Cadangan menunggu: ", positionNoUnitFound: "Tiada unit ahli ditemui untuk akaun anda.", positionSelectPrompt: "Pilih jawatan baru",
    unitSectionTitle: "Unit Kokurikulum Semasa (T6)", unitHistoryLink: "Sejarah", unitCurrentUnitLabel: "Unit semasa:", unitNotRegistered: "Belum berdaftar",
    unitSwitch: "Tukar", unitRegister: "Daftar", unitChange: "Tukar", unitSelectPlaceholder: "— Pilih unit —", unitReasonLabel: "Sebab / catatan (pilihan)", unitNotes: "Hanya unit yang mempunyai guru penasihat disenaraikan.", unitNoAdvisorMessage: "Tiada unit dengan guru penasihat ditemui untuk kategori ini. Sila hubungi pentadbir.", unitConfirmReplace: "Saya faham unit semasa akan diganti, dan jawatan akan diset semula kepada 'Ahli Aktif' selepas diluluskan.", unitPendingNotice: "Permohonan dihantar — menunggu kelulusan guru.", unitDialogTitleRegister: "Daftar Unit", unitDialogTitleChange: "Pertukaran Unit", unitRequestSuccess: "Permohonan dihantar. Sila tunggu kelulusan guru.", unitRequestPending: "Menunggu kelulusan", unitCancel: "Batal", unitApplyInfo: "Setiap kategori hanya satu unit. Permohonan perlu kelulusan guru sebelum unit dikemas kini.",
  },
  guru: {
    dashboardTitle: "Dashboard Guru", position: "Jawatan", scopeSchool: "Skop: Seluruh Sekolah", scopeUnit: "Skop: Unit Seliaan",
    linkMembers: "👥 Senarai Ahli & Jawatan", linkAttendance: "🗓️ Kehadiran Perjumpaan", linkAnalytics: "📊 Lihat Analitik", linkSelection: "🏆 Pilih Pelajar untuk Pertandingan",
    cardStudents: "Pelajar Diselia", cardPending: "Menunggu Tindakan", cardClub: "Kelab/Persatuan", cardSportBb: "Sukan / BB",
    statusPilihan: "Status Pilihan Unit T6", noMembers: "Tiada ahli dalam unit seliaan.",
    verifiedDocs: "Dokumen Laporan Disahkan", noVerifiedDocs: "Tiada laporan disahkan lagi.", weekly: "Mingguan", project: "Projek",
    membersTitle: "Senarai Nama Ahli", membersSub: "Tetapkan jawatan ahli menggunakan menu di setiap baris.", unitCount: "unit", memberCount: "ahli",
    colName: "Nama", colClass: "Kelas", colCurrentPos: "Jawatan Semasa", colMark: "Markah", colSetPos: "Tetapkan Jawatan", setPos: "Tetapkan",
    attendanceTitle: "Kehadiran Perjumpaan", attendanceSub: "Senarai kehadiran pelajar bagi setiap perjumpaan unit seliaan anda.", noSessions: "Tiada sesi perjumpaan direkod lagi.", meeting: "Perjumpaan", noAttendance: "Tiada rekod kehadiran untuk sesi ini.",
  },
  admin: {
    dashboardTitle: "Dashboard Pentadbir", students: "Pelajar", teachers: "Guru", userAccounts: "Akaun Pengguna", kokoRecords: "Rekod Kokurikulum",
    genderDist: "Taburan Jantina", noDemographics: "Data demografi belum dilengkapkan. Sila kemas kini melalui modul Demografi.", male: "Lelaki", female: "Perempuan",
    quickActions: "Tindakan Pantas",
    actManageStudents: "Urus Pelajar", actAddStudent: "➕ Tambah Pelajar", actAddTeacher: "➕ Tambah Guru", actImport: "Import Data (CSV/Excel)",
    actFormula: "Tetapan Formula Markah", actDemographics: "Kemas Kini Demografi", actManageTeachers: "Urus Guru & Penasihat", actAttendance: "Kehadiran (Setiap Perjumpaan)",
    actCertTemplate: "Templat e-Cert", actAnalytics: "📊 Analitik Keseluruhan", seeAlso: "Lihat juga:", teacherView: "Pandangan Guru", studentView: "Pandangan Pelajar",
    pelajarTitle: "Urus Pelajar", pelajarSub: "Senarai pelajar T6 (markah, nama, kelab, sukan, badan beruniform terkini). Klik Butiran untuk paparan penuh & muat turun PDF setiap pelajar.", downloadAll: "⬇ Muat turun semua (Excel)",
    colUnits: "Kelab / Sukan / BB", colPajsk: "PAJSK T6", colStatus: "Status", colActions: "Tindakan", detail: "Butiran", edit: "Edit",
  },
  laporan: {
    title: "Laporan SU/NSU", sub: "Laporan mingguan & laporan projek, dipaut terus ke sesi kehadiran berkaitan.", weekly: "Laporan Mingguan", project: "Laporan Projek", noRecords: "Tiada rekod lagi.", downloadVerified: "⬇ Muat turun dokumen disahkan", comment: "Komen",
    tabWeekly: "Laporan Mingguan", tabProject: "Laporan Projek", selectSessionOptional: "— Paut sesi kehadiran (pilihan) —", newProjectOption: "— Projek baharu (pra-program) —", projectNamePlaceholder: "Nama projek (untuk projek baharu)",
    workPlanLabel: "Kertas Kerja (pra)", impactReportLabel: "Laporan Impak (pasca)", financialSummaryPlaceholder: "Ringkasan kewangan (RM)", strengthPlaceholder: "Kekuatan", weaknessPlaceholder: "Kelemahan / penambahbaikan",
    submitForReview: "Hantar untuk Semakan", networkError: "Ralat rangkaian", loading: "Sedang memuat...", attachmentWorkPlan: "📋 kertas kerja", attachmentImpactReport: "📊 laporan impak",
    reportTimePlaceholder: "Masa (cth 2.30-4.30 ptg)", reportActivityPlaceholder: "Aktiviti / laporan ringkas", reportProjectOptionPrefix: "Pasca: ", reportUploadPrompt: "Pra-program: muat naik Kertas Kerja. Pasca-program: pilih projek di atas + muat naik Laporan Impak & isi maklumat.",
    sessionLabel: "Perjumpaan", attachmentLabel: "· 📎 lampiran", reportAttendanceLabel: "Kehadiran", reportViewSession: "Lihat sesi →", suNsuOnly: "Hanya untuk SU / NSU.",
  },
};

const en: Dict = {
  langName: { ms: "BM", en: "EN" },
  common: {
    kelab: "Club/Society", sukan: "Sports", uniform: "Uniformed Body",
    jawatan: "Position", peringkat: "Level", status: "Status",
    tingkatan5: "Form 5", tingkatan6: "Form 6", kembali: "Back", dashboard: "Dashboard",
    muatTurun: "Download", disahkan: "Verified", belumDisahkan: "Not Verified", hadir: "Present", tidakHadir: "Absent",
    tiadaData: "No data",
  },
  pajsk: {
    kehadiran: "Attendance", jawatan: "Position", penglibatan: "Participation", pencapaian: "Achievement",
    projekJawatan: "Project — Position", projekPeringkat: "Project — Level", ekstra: "Extra-curricular (bonus)",
  },
  header: { roleStudent: "Student", roleTeacher: "Advisor Teacher", roleAdmin: "Administrator", help: "Help", logout: "Log Out", notifications: "Notifications", theme: "Toggle light/dark mode" },
  login: {
    subtitle: "Form 6 Co-curriculum Management System", heading: "Log In",
    identifier: "MyKad (IC) Number", password: "Password",
    submit: "Log In", submitting: "Logging in...", loading: "Loading...",
    footer: "Log in using your MyKad (IC) number.",
    failed: "Login failed", networkError: "Network error. Please try again.",
  },
  pelajar: {
    welcome: "Welcome,", icNo: "IC No.:",
    linkAktiviti: "Achievements & Activities", linkKehadiran: "Attendance", linkLaporan: "Reports", linkJawatan: "Member Positions", linkButiran: "⬇ Personal Details (PDF)",
    scoreT6: "PAJSK Score (F6)", systemComputed: "system-computed", pctT6: "Percentage (F6)", fullMarks100: "/ 100 full marks",
    gred: "Grade", finalGrade: "final grade (A–E)",
    scoreT5: "PAJSK Score (F5)", importedRecord: "imported record", change: "Change", t5ToT6: "F5 → F6",
    marksByUnit: "Marks by Participation (F6)", participationTotal: "Participation Total",
    unitNote: "Note: overall score (100) = Attendance + Position + Participation + Achievement + Project; position & participation take the highest value across units.",
    attendanceTitle: "Meeting Attendance (Yearly)", present: "Present", sessionsRecorded: "sessions recorded", attendancePct: "Attendance %",
    outOf30: "out of 30 meetings", attendanceMark: "Attendance Mark", fullMarks40: "/ 50 full marks", pajskContribution: "PAJSK Contribution", countedInT6: "counted in F6 score",
    comparison: "F5 vs F6 Comparison", detail: "Detail", marksByCategory: "Marks by Category",
    currentUnits: "Current Co-curriculum Units (F6)", history: "History", achievements: "Achievements & Extra-curricular",
    backToDashboard: "← Back to Dashboard",
    activityTitle: "Achievements & External Activities", activitySubtitle: "Submit achievements & activities, upload evidence (letter/certificate), then wait for teacher approval.",
    activityTabs: { achievements: "Achievements", externalActivities: "External Activities" },
    achievementSection: "Achievements", externalActivitiesSection: "External Activities",
    noRecords: "No records.", commentLabel: "Comment", generateECert: "⬇ Generate e-Cert (PDF)",
    activityForm: {
      achievementName: "Achievement name", activityName: "External activity name", levelPlaceholder: "— Level —", dateLabel: "Date", evidenceLabel: "Evidence (certificate/letter)",
      letterLabel: "Letter", certificateLabel: "Certificate", uploadEvidence: "⬆ Upload evidence (letter & certificate)",
      submit: "Submit", submitToReview: "Submit for Review", reportPlaceholder: "Activity / short report",
      networkError: "Network error", fileTooLarge: "File too large. Upload limit is 4MB — please compress or reduce file size.",
      uploadSizeLimit: "File too large for server (limit 4.5MB). Please shrink the file.", fetchError: "Server error. Please try again or contact your teacher.", noToken: "No token. Please scan a valid QR code.", cancel: "Cancel",
      loading: "Loading...",
    },
    attendancePageTitle: "Member Attendance", attendanceSubtitle: "Open a meeting session, mark member attendance by list, or show a QR code for self check-in.",
    attendanceRestricted: "Attendance module is only for Secretary (SU) / Deputy Secretary (NSU). Contact your advisor if you should have access.",
    attendancePanel: {
      openSessionTitle: "Open Meeting Session", unitLabel: "Unit", meetingNumber: "Meeting #", dateLabel: "Date",
      openSessionButton: "Open Session", saveAttendanceButton: "Save Attendance", memberListTitle: "Member List", attendanceCount: "present", attendanceQrTitle: "Scan Attendance QR", attendanceQrInfo: "Members can scan this code (login required) to mark themselves present.",
      noUnits: "No units with members found for your account.", noToken: "No token. Please scan a valid QR code.", loading: "Recording attendance...", recording: "Session opened. Mark attendance or show the QR.", networkError: "Network error.",
    },
    reportPageTitle: "SU/NSU Reports", reportPageSubtitle: "Weekly & project reports, linked directly to related attendance sessions.",
    reportTabs: { weekly: "Weekly Reports", project: "Project Reports" },
    reportLinkSession: "View session →", reportUploadPrompt: "Pre-program: upload a Work Plan. Post-program: choose a project above + upload Impact Report & fill in details.",
    reportNoAttachment: "No records yet.",
    reportSelectSessionPlaceholder: "— Link attendance session (optional) —", reportProjectOptionPrefix: "Post: ", reportNewProjectPlaceholder: "— New project (pre-program) —",
    reportTimePlaceholder: "Time (e.g. 2.30-4.30 PM)", reportActivityPlaceholder: "Activity / short report", reportPaperLabel: "Work Plan (pre)", reportImpactLabel: "Impact Report (post)", reportFinancePlaceholder: "Financial summary (RM)", reportStrengthPlaceholder: "Strengths", reportWeaknessPlaceholder: "Weaknesses / improvements", reportSubmitReview: "Submit for Review", reportSubmit: "Submit", reportNoRecords: "No records yet.", reportAttendanceLabel: "Attendance", reportViewSession: "View session →", reportAttachmentLabel: "· 📎 attachment", loading: "Loading...", suNsuOnly: "For Secretary / Deputy Secretary only.", sessionLabel: "Meeting",
    transferTitle: "Co-curriculum Unit Transfer", transferSubtitle: "Apply to change Club/Sport/Uniformed Body. Units update after teacher approval.",
    transferCurrentUnits: "Current Units (F6)", transferHistory: "Application History",
    transferFormTitle: "Transfer Request Form", transferTypeLabel: "Co-curriculum Type", transferNewUnitLabel: "New Unit", transferReasonLabel: "Reason (optional)",
    transferReasonPlaceholder: "e.g. scheduling conflict", transferSubmit: "Submit Request", transferPending: "A request is pending approval", transferPendingNotice: "You must wait for the current request to be decided before submitting another.", transferNetworkError: "Network error.",
    transferCurrentUnit: "Current unit:", transferRegister: "Register", transferChange: "Change", transferNoRequest: "No requests yet.", transferNoAdvisor: "No adviser is assigned to this category. Contact admin.", transferExample: "e.g. scheduling conflict", transferWaitingNotice: "Please wait for teacher approval before applying again.", transferConfirmReplace: "I understand the current unit will be replaced, and the position will be reset to 'Active Member' after approval.", transferApplyInfo: "Apply to transfer your unit and wait for teacher approval.", transferUnitsOnlyWithAdvisor: "Only units with an adviser are listed.", transferSelectUnitPlaceholder: "— Select a unit —", transferUnitNotRegistered: "Not registered",
    scanPageTitle: "Check-in Attendance", scanLoading: "Loading...", scanNoToken: "No token. Please scan a valid QR code.", scanNetworkError: "Network error.", scanCheckinTitle: "Check-in Attendance", scanBack: "← Back",
    positionTitle: "Member Positions (F6)", positionSubtitle: "Suggest the top member positions for your unit. Suggestions are sent to teachers for approval before PAJSK marks update.",
    positionRestricted: "Position assignment is only for Secretary (SU) / Deputy Secretary (NSU).", positionNoMembers: "No unit members found.",
    positionSuggest: "Suggest", positionPending: "Pending", positionChoose: "— Choose a position —", positionChooseFirst: "Please choose a position first.", positionCurrent: "Current position:", positionPendingHint: "Pending suggestion: ", positionNoUnitFound: "No unit members found for your account.", positionSelectPrompt: "Choose a new position",
    unitSectionTitle: "Current Co-curriculum Units (F6)", unitHistoryLink: "History", unitCurrentUnitLabel: "Current unit:", unitNotRegistered: "Not registered",
    unitSwitch: "Change", unitRegister: "Register", unitChange: "Change", unitSelectPlaceholder: "— Select a unit —", unitReasonLabel: "Reason / note (optional)", unitNotes: "Only units with an adviser are listed.", unitNoAdvisorMessage: "No units with an adviser found for this category. Contact admin.", unitConfirmReplace: "I understand the current unit will be replaced, and the position will be reset to 'Active Member' after approval.", unitPendingNotice: "Request sent — awaiting teacher approval.", unitDialogTitleRegister: "Register Unit", unitDialogTitleChange: "Unit Transfer", unitRequestSuccess: "Request sent. Please wait for teacher approval.", unitRequestPending: "Awaiting approval", unitCancel: "Cancel", unitApplyInfo: "Each category has one unit. Requests need teacher approval before the unit is updated.",
  },
  guru: {
    dashboardTitle: "Teacher Dashboard", position: "Position", scopeSchool: "Scope: Whole School", scopeUnit: "Scope: Supervised Units",
    linkMembers: "👥 Member List & Positions", linkAttendance: "🗓️ Meeting Attendance", linkAnalytics: "📊 View Analytics", linkSelection: "🏆 Select Students for Competition",
    cardStudents: "Students Supervised", cardPending: "Pending Actions", cardClub: "Club/Society", cardSportBb: "Sports / UB",
    statusPilihan: "F6 Unit Selection Status", noMembers: "No members in supervised units.",
    verifiedDocs: "Verified Report Documents", noVerifiedDocs: "No verified reports yet.", weekly: "Weekly", project: "Project",
    membersTitle: "Member Name List", membersSub: "Assign member positions using the menu on each row.", unitCount: "unit(s)", memberCount: "member(s)",
    colName: "Name", colClass: "Class", colCurrentPos: "Current Position", colMark: "Mark", colSetPos: "Assign Position", setPos: "Assign",
    attendanceTitle: "Meeting Attendance", attendanceSub: "Student attendance list for each meeting of your supervised units.", noSessions: "No meeting sessions recorded yet.", meeting: "Meeting", noAttendance: "No attendance records for this session.",
  },
  admin: {
    dashboardTitle: "Administrator Dashboard", students: "Students", teachers: "Teachers", userAccounts: "User Accounts", kokoRecords: "Co-curriculum Records",
    genderDist: "Gender Distribution", noDemographics: "Demographic data not yet completed. Please update via the Demographics module.", male: "Male", female: "Female",
    quickActions: "Quick Actions",
    actManageStudents: "Manage Students", actAddStudent: "➕ Add Student", actAddTeacher: "➕ Add Teacher", actImport: "Import Data (CSV/Excel)",
    actFormula: "Mark Formula Settings", actDemographics: "Update Demographics", actManageTeachers: "Manage Teachers & Advisors", actAttendance: "Attendance (Per Meeting)",
    actCertTemplate: "e-Cert Template", actAnalytics: "📊 Overall Analytics", seeAlso: "See also:", teacherView: "Teacher View", studentView: "Student View",
    pelajarTitle: "Manage Students", pelajarSub: "F6 student list (latest marks, name, club, sport, uniformed body). Click Details for the full view & per-student PDF download.", downloadAll: "⬇ Download all (Excel)",
    colUnits: "Club / Sport / UB", colPajsk: "PAJSK F6", colStatus: "Status", colActions: "Actions", detail: "Details", edit: "Edit",
  },
  laporan: {
    title: "SU/NSU Reports", sub: "Weekly & project reports, linked directly to related attendance sessions.", weekly: "Weekly Reports", project: "Project Reports", noRecords: "No records yet.", downloadVerified: "⬇ Download verified document", comment: "Comment",
    tabWeekly: "Weekly Reports", tabProject: "Project Reports", selectSessionOptional: "— Link attendance session (optional) —", newProjectOption: "— New project (pre-program) —", projectNamePlaceholder: "Project name (for a new project)",
    workPlanLabel: "Work Plan (pre)", impactReportLabel: "Impact Report (post)", financialSummaryPlaceholder: "Financial summary (RM)", strengthPlaceholder: "Strengths", weaknessPlaceholder: "Weaknesses / improvements",
    submitForReview: "Submit for Review", networkError: "Network error", loading: "Loading...", attachmentWorkPlan: "📋 work plan", attachmentImpactReport: "📊 impact report",
    reportTimePlaceholder: "Time (e.g. 2.30-4.30 PM)", reportActivityPlaceholder: "Activity / short report", reportProjectOptionPrefix: "Post: ", reportUploadPrompt: "Pre-program: upload a Work Plan. Post-program: choose a project above + upload Impact Report & fill in details.",
    sessionLabel: "Meeting", attachmentLabel: "· 📎 attachment", reportAttendanceLabel: "Attendance", reportViewSession: "View session →", suNsuOnly: "For Secretary / Deputy Secretary only.",
  },
};

export const messages: Record<Locale, Dict> = { ms, en };
export function getDict(locale: Locale): Dict {
  return messages[locale] ?? ms;
}

export function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const locale = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
