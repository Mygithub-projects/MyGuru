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
    kelab: string; sukan: string; uniform: string; perkhidmatan: string; pilihan: string;
    jawatan: string; peringkat: string; status: string;
    tingkatan5: string; tingkatan6: string; kembali: string; dashboard: string;
    muatTurun: string; disahkan: string; belumDisahkan: string; hadir: string; tidakHadir: string;
    statusBelumPilih: string; statusMohonTukar: string; statusKekal: string;
    tiadaData: string;
    simpan: string; menyimpan: string; padam: string; memadam: string; batal: string;
    selesai: string; aktif: string; ralatRangkaian: string;
    kaum: { melayu: string; cina: string; india: string; lainLain: string };
    agama: { islam: string; buddha: string; hindu: string; kristian: string; lainLain: string };
    jawatanKoko: {
      guruPenasihat: string; penolongKetuaGP: string; ketuaGP: string;
      penolongSU: string; pemantauKUPP: string; penyelaras: string;
    };
    subRolePelajar: { pelajar: string; su: string; nsu: string };
    perananUnit: { penasihat: string; ketuaPenasihat: string };
    sortToggle: { newest: string; oldest: string; ariaLabel: string };
    modalClose: string;
  };
  // Istilah rasmi komponen PAJSK (§1.1) — terjemahan EN tepat (§8).
  pajsk: {
    kehadiran: string; jawatan: string; penglibatan: string; pencapaian: string;
    projekJawatan: string; projekPeringkat: string; ekstra: string;
  };
  header: { roleStudent: string; roleTeacher: string; roleAdmin: string; help: string; logout: string; notifications: string; theme: string; chatbot: string };
  // Chrome global (NotifBell, TindakanBadge, AgentChat) — dipapar pada SEMUA
  // peranan/laman, jadi terasing daripada `header` (label peranan/tema).
  chrome: {
    notifTitle: string; notifEmpty: string;
    tindakanLabel: string; tindakanTitle: string;
    agentChat: {
      subtitle: string; inputPlaceholder: string; sessionExpired: string;
      genericError: string; networkError: string; noAnswer: string; proposalsSuffix: string;
      greeting: { Pelajar: string; Guru: string; Admin: string };
      suggestions: { Pelajar: string[]; Guru: string[]; Admin: string[] };
    };
  };
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
    livePending: {
      title: string; updatedAt: string; autoOn: string; autoOff: string; loading: string; noItems: string; total: string;
      labels: {
        pencapaian: string; aktivitiLuar: string; pertukaran: string; laporanMingguan: string;
        laporanProjek: string; sesiKehadiran: string; cadanganJawatan: string;
      };
    };
    reviewPanel: {
      networkError: string; emptyAll: string;
      unitTransferTitle: string; positionSuggestionTitle: string; achievementTitle: string;
      externalActivityTitle: string; attendanceSessionTitle: string;
      weeklyReportTitle: string; projectReportTitle: string;
      approve: string; reject: string; confirm: string; query: string;
      rejectReasonPrompt: string; queryCommentPrompt: string;
      evidenceComplete: string; evidenceIncomplete: string; marksPlaceholder: string;
      aiSuggestTitle: string;
    };
    cadanganAiPanel: {
      title: string; pendingCountTpl: string; sortNewest: string; sortOldest: string; sortAriaLabel: string;
      descPrefix: string; descBold: string; descSuffix: string; emptyState: string; suggestedLabel: string;
      approveBtn: string; rejectBtn: string; rejectPrompt: string; networkError: string;
      jenis: { unitTransfer: string; achievement: string; recalc: string; ecert: string };
    };
    senaraiAhliTabs: { tabsAriaLabel: string; marksComputed: string; marksNotYet: string };
    jawatanAssign: { placeholder: string; assignTitle: string; networkError: string };
    pemilihan: {
      back: string; title: string; subtitle: string; noStudents: string;
      detailsTitle: string; competitionName: string; competitionNamePlaceholder: string;
      level: string; dateOptional: string;
      selectStudents: string; selectedSuffix: string; searchPlaceholder: string;
      selectAll: string; noMatch: string; submitBtnTpl: string; submittingBtn: string;
      footerNote: string; errNameRequired: string; errNoSelection: string; errGeneric: string; networkError: string;
      levels: { zonDaerah: string; daerah: string; negeri: string; kebangsaan: string; antarabangsa: string };
    };
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
    pelajarDetail: {
      backToList: string; downloadPdf: string; viewPdf: string; attendanceLabel: string;
      participationTitle: string; notRegistered: string; totalLabel: string;
      breakdownTitle: string; assessmentComponent: string; marksCol: string;
      achievementsTitle: string;
    };
    back: string; backToGuru: string; backToPelajarList: string; backToDashboard: string;
    analitikPage: { title: string; subtitle: string };
    demografiPage: { subtitle: string; colGender: string; colRace: string; colReligion: string };
    guruPage: { title: string; subtitle: string };
    guruClient: {
      statusAktif: string; unitDiselia: string; noUnitAssigned: string; unitNamePlaceholder: string;
      addUnit: string; deleteConfirmTpl: string; deleteFailed: string; saved: string;
      save: string; deleteBtn: string; deleting: string;
    };
    guruTambahPage: { title: string; subtitle: string };
    guruForm: {
      fullName: string; fullNamePlaceholder: string; email: string; emailPlaceholder: string;
      icOptional: string; icPlaceholder: string; position: string; unitHint: string;
      credentialNote: string; credentialReveal: string; usernameLabel: string; passwordLabel: string;
      copyCredentials: string; submitAdd: string; submitting: string;
      addSuccess: string; addFailed: string;
    };
    importPage: { title: string; subtitle: string };
    importClient: {
      // Nota: Nilai berikut TEMPLAT rentetan (bukan fungsi) — ImportClient
      // ialah Client Component; fungsi tidak boleh dihantar merentasi
      // sempadan Server->Client. Placeholder digantikan dengan .replace().
      pajskTab: string; guruTab: string; choosePajskInfo: string; guruUpsertInfo: string;
      previewBtn: string; uploadBtn: string; processing: string; previewTitle: string;
      totalRecords: string; newLabel: string; changedLabel: string; unchangedLabel: string;
      warningPrefix: string; warningWillRecalcTpl: string; warningSuffix: string;
      studentCol: string; statusCol: string; changesCol: string; parseWarningsTpl: string;
      cancel: string; confirmImport: string; confirming: string;
      importDoneTpl: string; recalcedTpl: string;
      warningsCountTpl: string; historyTitle: string; noHistory: string;
      dateCol: string; fileCol: string; typeCol: string; recordsCol: string; newChangedCol: string;
      pelajarBaruTab: string; pelajarBaruInfo: string; pelajarBaruWarningTpl: string;
      noFileSelected: string;
    };
    kehadiranPage: {
      title: string; subtitle: string; totalMeetings: string; avgAttendance: string; notVerified: string;
      unitLabel: string; allUnits: string; typeLabel: string; allTypes: string; filterBtn: string;
      resetBtn: string; listTitle: string; noSessions: string;
    };
    kehadiranTable: {
      colUnit: string; colType: string; colMeeting: string; colDate: string; colPresent: string;
      colPercent: string; colStatus: string; meeting: string; loading: string; presentCount: string;
      noAttendanceRecords: string; failedDetail: string; present: string; absent: string;
    };
    editPelajarPage: { title: string; subtitle: string };
    pelajarForm: {
      fullName: string; icNoDisabled: string; classT6: string; role: string; gender: string;
      race: string; religion: string; email: string; phone: string; accountActive: string;
      done: string; saveChanges: string; saving: string; updateSuccess: string; updateFailed: string;
    };
    tambahPelajarPage: { title: string; subtitleBefore: string; subtitleLink: string };
    tambahPelajarForm: {
      icForLogin: string; classPlaceholder: string; emailOptional: string; phoneOptional: string;
      credentialNote: string; addSuccess: string; addFailed: string;
      credentialReveal: string; usernameLabel: string; passwordLabel: string; copyCredentials: string;
      submitAdd: string; submitting: string;
    };
    sijilPage: { title: string; subtitle: string };
    sijilClient: {
      instName: string; certTitle: string; signerName: string; signerPosition: string; stampText: string;
      saveTemplate: string; saving: string; previewTitle: string; previewStudent: string; previewActivity: string;
      previewIc: string; previewLevel: string; previewDate: string; previewSerial: string;
    };
    tetapanPage: { title: string; subtitle: string };
    tetapanClient: { saveSettings: string; saving: string };
  };
  laporan: {
    title: string; sub: string; weekly: string; project: string; noRecords: string; downloadVerified: string; comment: string;
    tabWeekly: string; tabProject: string; selectSessionOptional: string; newProjectOption: string; projectNamePlaceholder: string;
    workPlanLabel: string; impactReportLabel: string; financialSummaryPlaceholder: string; strengthPlaceholder: string; weaknessPlaceholder: string;
    submitForReview: string; networkError: string; loading: string; attachmentWorkPlan: string; attachmentImpactReport: string;
    reportTimePlaceholder: string; reportActivityPlaceholder: string; reportProjectOptionPrefix: string; reportUploadPrompt: string;
    sessionLabel: string; attachmentLabel: string; reportAttendanceLabel: string; reportViewSession: string; suNsuOnly: string;
  };
  insights: {
    title: string; badge: string; footerNote: string; aiLabel: string; aiLoading: string;
    kpiPajskAvg: string; kpiGradeA: string; kpiAvgAttendance: string; kpiPendingActions: string;
    unitMarksSuffix: string; studentsSuffix: string; noIssues: string;
    avgHigh: (avg: number, pct: number) => string;
    avgLow: (avg: number) => string;
    attendanceHighest: (unit: string, pct: number) => string;
    attendanceLowest: (unit: string, pct: number) => string;
    notSelected: (n: number) => string;
    pendingActionsText: (n: number) => string;
  };
  analitik: {
    pageTitle: string; back: string; scopeSchool: string; scopeUnit: (units: string) => string; noUnit: string;
    exportExcel: string; exportPdf: string;
    totalStudents: string; avgMark: string; gradeAStudents: string; avgAttendance: string;
    gradeDist: string; achievementByLevel: string; attendanceByUnit: string; projectReportStatus: string;
    unitSelectionStatus: string; attendanceTrend: string; weeklyReportCompliance: string;
    total: string; verified: string; pending: string; complianceRate: string;
    demographicsPrefix: string; crosstabTitle: string; gender: string;
    noChartData: string; valueIn: string;
  };
  bantuan: {
    subtitle: string;
    pelajar: { title: string; back: string; sections: { h: string; isi: string[] }[] };
    guru: { title: string; back: string; sections: { h: string; isi: string[] }[] };
    admin: { title: string; back: string; sections: { h: string; isi: string[] }[] };
  };
  tukarKataLaluan: {
    title: string; subtitleForced: string; subtitleUpdate: string;
    currentPassword: string; newPassword: string; confirmPassword: string;
    submit: string; submitting: string; mismatchError: string; networkError: string;
  };
}

const ms: Dict = {
  langName: { ms: "BM", en: "EN" },
  common: {
    kelab: "Kelab/Persatuan", sukan: "Sukan", uniform: "Badan Beruniform", perkhidmatan: "Unit Perkhidmatan", pilihan: "pilihan",
    jawatan: "Jawatan", peringkat: "Peringkat", status: "Status",
    tingkatan5: "Tingkatan 5", tingkatan6: "Tingkatan 6", kembali: "Kembali", dashboard: "Dashboard",
    muatTurun: "Muat turun", disahkan: "Disahkan", belumDisahkan: "Belum Disahkan", hadir: "Hadir", tidakHadir: "Tidak Hadir",
    statusBelumPilih: "Belum Pilih", statusMohonTukar: "Mohon Tukar", statusKekal: "Kekal",
    tiadaData: "Tiada data",
    simpan: "Simpan", menyimpan: "Menyimpan…", padam: "Padam", memadam: "Memadam…", batal: "Batal",
    selesai: "Selesai", aktif: "Aktif", ralatRangkaian: "Ralat rangkaian.",
    kaum: { melayu: "Melayu", cina: "Cina", india: "India", lainLain: "Lain-lain" },
    agama: { islam: "Islam", buddha: "Buddha", hindu: "Hindu", kristian: "Kristian", lainLain: "Lain-lain" },
    jawatanKoko: {
      guruPenasihat: "Guru Penasihat", penolongKetuaGP: "Penolong Ketua GP", ketuaGP: "Ketua Guru Penasihat",
      penolongSU: "Penolong SU Kokurikulum", pemantauKUPP: "Pemantau (KUPP)", penyelaras: "Penyelaras Kokurikulum",
    },
    subRolePelajar: { pelajar: "Pelajar biasa", su: "Setiausaha (SU)", nsu: "Naib Setiausaha (NSU)" },
    perananUnit: { penasihat: "Penasihat", ketuaPenasihat: "Ketua Penasihat" },
    sortToggle: { newest: "Terkini dahulu", oldest: "Terlama dahulu", ariaLabel: "Susun ikut tarikh" },
    modalClose: "Tutup",
  },
  pajsk: {
    kehadiran: "Kehadiran", jawatan: "Jawatan", penglibatan: "Penglibatan", pencapaian: "Pencapaian",
    projekJawatan: "Projek — Jawatan", projekPeringkat: "Projek — Peringkat", ekstra: "Ekstra Kurikulum (bonus)",
  },
  header: { roleStudent: "Pelajar", roleTeacher: "Guru Penasihat", roleAdmin: "Pentadbir", help: "Bantuan", logout: "Log Keluar", notifications: "Notifikasi", theme: "Tukar mod terang/gelap", chatbot: "Chatbot" },
  chrome: {
    notifTitle: "Notifikasi", notifEmpty: "Tiada notifikasi.",
    tindakanLabel: "Tindakan", tindakanTitle: "Item menunggu tindakan",
    agentChat: {
      subtitle: "Pembantu kokurikulum", inputPlaceholder: "Taip mesej…",
      sessionExpired: "Sesi tamat. Sila log masuk semula.", genericError: "Maaf, berlaku ralat.",
      networkError: "Ralat rangkaian. Cuba lagi.", noAnswer: "(tiada jawapan)",
      proposalsSuffix: "cadangan dihantar untuk kelulusan",
      greeting: {
        Pelajar: "Hai! Saya MyGuru AI. Tanya saya tentang markah PAJSK, pecahan komponen, atau unit anda.",
        Guru: "Hai! Saya MyGuru AI. Saya boleh bantu semak item menunggu, analitik unit, dan rangka cadangan kelulusan.",
        Admin: "Hai! Saya MyGuru AI. Tanya saya tentang analitik kohort, demografi, atau item menunggu tindakan.",
      },
      suggestions: {
        Pelajar: ["Apakah markah PAJSK saya?", "Berapa markah kehadiran saya?", "Terangkan formula PAJSK"],
        Guru: ["Berapa item menunggu semakan?", "Tunjukkan analitik kehadiran", "Terangkan formula PAJSK"],
        Admin: ["Berapa item menunggu tindakan?", "Tunjukkan analitik demografi", "Analitik kehadiran sekolah"],
      },
    },
  },
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
    livePending: {
      title: "Menunggu Tindakan (Langsung)", updatedAt: "Dikemas kini:", autoOn: "Auto: ON", autoOff: "Auto: OFF",
      loading: "Memuatkan…", noItems: "✓ Tiada item menunggu tindakan.", total: "jumlah",
      labels: {
        pencapaian: "Pencapaian", aktivitiLuar: "Aktiviti Luar", pertukaran: "Pertukaran Unit",
        laporanMingguan: "Laporan Mingguan", laporanProjek: "Laporan Projek",
        sesiKehadiran: "Sesi Kehadiran", cadanganJawatan: "Cadangan Jawatan",
      },
    },
    reviewPanel: {
      networkError: "Ralat rangkaian", emptyAll: "🎉 Tiada item menunggu tindakan. Semua telah disemak.",
      unitTransferTitle: "Permohonan Pertukaran Unit", positionSuggestionTitle: "Cadangan Jawatan Tertinggi",
      achievementTitle: "Pencapaian Menunggu Pengesahan", externalActivityTitle: "Aktiviti Luar Menunggu Pengesahan",
      attendanceSessionTitle: "Sesi Kehadiran Belum Disahkan",
      weeklyReportTitle: "Laporan Mingguan", projectReportTitle: "Laporan Projek",
      approve: "Lulus", reject: "Tolak", confirm: "Sahkan", query: "Kuiri",
      rejectReasonPrompt: "Sebab penolakan (pilihan):", queryCommentPrompt: "Komen kuiri:",
      evidenceComplete: "Eviden lengkap (surat + sijil)", evidenceIncomplete: "⚠ Eviden tidak lengkap",
      marksPlaceholder: "Markah", aiSuggestTitle: "Markah dicadang AI mengikut peringkat (rubrik §5.5). Boleh laras sebelum sahkan.",
    },
    cadanganAiPanel: {
      title: "🤖 Cadangan AI", pendingCountTpl: "{n} menunggu", sortNewest: "Terkini dahulu", sortOldest: "Terlama dahulu",
      sortAriaLabel: "Susun ikut tarikh",
      descPrefix: "Cadangan dijana oleh MyGuru AI. Tiada markah, kelulusan atau e-Cert berubah sehingga anda",
      descBold: "luluskan", descSuffix: "di sini.",
      emptyState: "Tiada cadangan AI menunggu kelulusan.", suggestedLabel: "Cadang:",
      approveBtn: "Luluskan", rejectBtn: "Tolak", rejectPrompt: "Sebab penolakan (pilihan):", networkError: "Ralat rangkaian",
      jenis: { unitTransfer: "Pertukaran Unit", achievement: "Pengesahan Pencapaian", recalc: "Kira Semula Markah", ecert: "Jana e-Cert" },
    },
    senaraiAhliTabs: { tabsAriaLabel: "Unit seliaan", marksComputed: "markah dikira", marksNotYet: "belum ada markah" },
    jawatanAssign: { placeholder: "— Tetapkan —", assignTitle: "Tetapkan jawatan", networkError: "Ralat rangkaian." },
    pemilihan: {
      back: "← Kembali ke Dashboard", title: "Pilih Pelajar untuk Pertandingan / Sukan",
      subtitle: "Pilih pelajar mewakili pada peringkat Zon/Daerah, Negeri, Kebangsaan atau Antarabangsa. Setiap pilihan mencipta penyertaan Menunggu Pengesahan — markah & e-Cert diberi selepas surat & sijil dimuat naik dan disahkan.",
      noStudents: "Tiada pelajar dalam skop seliaan anda.",
      detailsTitle: "Butiran Pertandingan", competitionName: "Nama Pertandingan / Sukan",
      competitionNamePlaceholder: "cth: Kejohanan Bola Tampar MSSD",
      level: "Peringkat", dateOptional: "Tarikh (pilihan)",
      selectStudents: "Pilih Pelajar", selectedSuffix: "dipilih", searchPlaceholder: "Cari nama / kelas / sukan…",
      selectAll: "Pilih semua", noMatch: "Tiada pelajar sepadan.", submitBtnTpl: "Pilih {n} Pelajar", submittingBtn: "Memproses…",
      footerNote: "Penyertaan akan berstatus “Menunggu Pengesahan”. Markah peringkat diberi selepas sijil disahkan.",
      errNameRequired: "Masukkan nama pertandingan.", errNoSelection: "Pilih sekurang-kurangnya seorang pelajar.",
      errGeneric: "Ralat memproses.", networkError: "Ralat rangkaian.",
      levels: { zonDaerah: "Zon/Daerah", daerah: "Daerah", negeri: "Negeri", kebangsaan: "Kebangsaan", antarabangsa: "Antarabangsa" },
    },
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
    pelajarDetail: {
      backToList: "← Senarai Pelajar", downloadPdf: "⬇ Muat turun PDF", viewPdf: "👁 Papar PDF", attendanceLabel: "Kehadiran",
      participationTitle: "Penyertaan & Markah (T6)", notRegistered: "Belum berdaftar dalam mana-mana unit.", totalLabel: "Jumlah",
      breakdownTitle: "Pecahan Markah PAJSK (T6)", assessmentComponent: "Komponen Pentaksiran", marksCol: "Markah",
      achievementsTitle: "Pencapaian & Aktiviti",
    },
    back: "← Kembali", backToGuru: "← Kembali ke Urus Guru", backToPelajarList: "← Kembali ke Senarai Pelajar", backToDashboard: "← Kembali ke Dashboard",
    analitikPage: { title: "Analitik Keseluruhan Kohort", subtitle: "Gred, markah, kehadiran, pencapaian, projek, laporan & demografi seluruh sekolah." },
    demografiPage: { subtitle: "Lengkapkan Jantina, Kaum & Agama pelajar untuk analitik demografi.", colGender: "Jantina", colRace: "Kaum", colReligion: "Agama" },
    guruPage: { title: "Urus Guru & Guru Penasihat", subtitle: "Tetapkan jawatan kokurikulum dan unit seliaan (Kelab/Sukan/Badan Beruniform) setiap guru. Hanya unit dengan guru penasihat boleh dipohon oleh pelajar." },
    guruClient: {
      statusAktif: "Aktif", unitDiselia: "Unit Diselia (Kelab / Sukan / Badan Beruniform / Perkhidmatan)",
      noUnitAssigned: "Tiada unit ditugaskan. Guru ini tidak dapat melihat/mengesahkan mana-mana pelajar.",
      unitNamePlaceholder: "Nama unit (cth: Kelab Komputer)", addUnit: "➕ Tambah unit",
      deleteConfirmTpl: `Padam guru "{nama}"?\n\nTindakan ini KEKAL dan akan memadam akaun log masuk guru serta penugasan unitnya. Tidak boleh dibatalkan.`,
      deleteFailed: "Gagal memadam guru.", saved: "✓ Disimpan", save: "Simpan", deleteBtn: "Padam", deleting: "Memadam…",
    },
    guruTambahPage: { title: "Tambah Guru Baharu", subtitle: "Daftarkan guru/guru penasihat baharu beserta jawatan kokurikulum dan unit seliaan. Sistem akan mencipta akaun log masuk untuk guru ini secara automatik." },
    guruForm: {
      fullName: "Nama penuh *", fullNamePlaceholder: "cth: Cikgu Ahmad bin Ali", email: "Email (untuk log masuk) *", emailPlaceholder: "cikgu@sekolah.edu.my",
      icOptional: "No. IC (pilihan)", icPlaceholder: "12 digit", position: "Jawatan Kokurikulum *",
      unitHint: "Guru hanya boleh melihat & mengesahkan pelajar dalam unit yang ditugaskan di sini. Boleh tambah lebih daripada satu unit.",
      credentialNote: "Akaun log masuk dicipta automatik (username = email). Kata laluan unik dijana dan dipaparkan sekali sahaja selepas simpan; guru mesti menukarnya semasa log masuk pertama.",
      credentialReveal: "🔑 Kata laluan dipaparkan SEKALI sahaja — salin & berikan kepada guru.", usernameLabel: "Username", passwordLabel: "Kata laluan",
      copyCredentials: "Salin kredensial", submitAdd: "Tambah Guru", submitting: "Menyimpan…",
      addSuccess: "Guru berjaya ditambah.", addFailed: "Gagal menambah guru.",
    },
    importPage: { title: "Import Data (CSV/Excel)", subtitle: "Muat naik fail PAJSK (pelajar) atau borang pendaftaran Guru. No. IC dibaca sebagai teks (digit penuh dikekalkan). Rekod sedia ada dikemas kini (upsert)." },
    importClient: {
      pajskTab: "PAJSK (Pelajar)", guruTab: "Pendaftaran Guru",
      choosePajskInfo: "Fail PAJSK dipratonton dahulu — perbezaan dipaparkan sebelum apa-apa markah berubah.",
      guruUpsertInfo: "Rekod guru dikemas kini terus (upsert).",
      previewBtn: "Pratonton Perbezaan", uploadBtn: "Muat Naik & Import", processing: "Memproses...", previewTitle: "Pratonton Perbezaan",
      totalRecords: "Jumlah rekod", newLabel: "Baharu", changedLabel: "Berubah", unchangedLabel: "Tiada perubahan",
      warningPrefix: "⚠️ Amaran: Pengesahan akan menulis", warningWillRecalcTpl: "{n1} rekod dan mengira semula markah {n2} pelajar",
      warningSuffix: "Operasi ini mengubah markah ramai pelajar sekaligus dan tidak boleh dibatalkan secara automatik.",
      studentCol: "Pelajar", statusCol: "Status", changesCol: "Perubahan", parseWarningsTpl: "{n} amaran parsing (rekod bermasalah dilangkau).",
      cancel: "Batal", confirmImport: "Sahkan & Import + Kira Semula", confirming: "Mengesahkan...",
      importDoneTpl: "✓ Import selesai: {ok}/{total} rekod ditulis", recalcedTpl: "; {n} pelajar dikira semula.",
      warningsCountTpl: "{n} amaran", historyTitle: "Histori Import (Audit)", noHistory: "Tiada rekod import lagi.",
      dateCol: "Tarikh", fileCol: "Fail", typeCol: "Jenis", recordsCol: "Rekod", newChangedCol: "Baharu / Berubah",
      pelajarBaruTab: "Pelajar Baharu (Tanpa Unit)",
      pelajarBaruInfo: "Cipta akaun pelajar baharu (Nama/Kelas/No.IC sahaja) — pelajar daftar Kelab/Sukan/Badan Beruniform/Unit Perkhidmatan sendiri selepas log masuk pertama, tertakluk kelulusan guru/admin.",
      pelajarBaruWarningTpl: "Pengesahan akan cipta {n} akaun pelajar baharu. Log masuk kali pertama: No. IC sebagai nama pengguna DAN kata laluan (wajib tukar kata laluan selepas log masuk). Tiada unit atau markah PAJSK dicipta — pelajar daftar sendiri kemudian, tertakluk kelulusan guru/admin.",
      noFileSelected: "Sila pilih fail Excel/CSV dahulu (klik \"Choose File\" di atas).",
    },
    kehadiranPage: {
      title: "Kehadiran — Setiap Perjumpaan", subtitle: "Klik mana-mana baris untuk melihat senarai nama hadir/tidak hadir.",
      totalMeetings: "Jumlah Perjumpaan", avgAttendance: "Purata Kehadiran", notVerified: "Belum Disahkan",
      unitLabel: "Unit", allUnits: "Semua unit", typeLabel: "Jenis", allTypes: "Semua", filterBtn: "Tapis",
      resetBtn: "Reset", listTitle: "Senarai Perjumpaan", noSessions: "Tiada sesi kehadiran untuk tapisan ini.",
    },
    kehadiranTable: {
      colUnit: "Unit", colType: "Jenis", colMeeting: "Perjumpaan", colDate: "Tarikh", colPresent: "Hadir",
      colPercent: "%", colStatus: "Status", meeting: "Perjumpaan", loading: "Memuatkan…", presentCount: "hadir",
      noAttendanceRecords: "Tiada rekod kehadiran ditanda.", failedDetail: "Gagal memuat butiran.", present: "✓ Hadir", absent: "✗ Tidak Hadir",
    },
    editPelajarPage: { title: "Edit Pelajar", subtitle: "Kemas kini maklumat profil pelajar. No. IC (username log masuk) tidak boleh diubah. Markah PAJSK & unit kokurikulum diuruskan melalui modul berkaitan / import." },
    pelajarForm: {
      fullName: "Nama penuh *", icNoDisabled: "No. IC (tidak boleh diubah)", classT6: "Kelas T6", role: "Peranan",
      gender: "Jantina", race: "Kaum", religion: "Agama", email: "Email", phone: "No. Telefon", accountActive: "Akaun aktif (boleh log masuk)",
      done: "Selesai", saveChanges: "Simpan Perubahan", saving: "Menyimpan…",
      updateSuccess: "Maklumat dikemas kini.", updateFailed: "Gagal mengemas kini.",
    },
    tambahPelajarPage: { title: "Tambah Pelajar Baharu", subtitleBefore: "Daftarkan pelajar T6 baharu secara individu. Sistem akan mencipta akaun log masuk (No. IC) secara automatik. Untuk kemasukan pukal, gunakan", subtitleLink: "Import Data" },
    tambahPelajarForm: {
      icForLogin: "No. IC (untuk log masuk) *", classPlaceholder: "cth: T6 Atas Sains 1", emailOptional: "Email (pilihan)", phoneOptional: "No. Telefon (pilihan)",
      credentialNote: "Akaun log masuk dicipta automatik (username = No. IC). Kata laluan unik dijana dan dipaparkan sekali sahaja selepas simpan; pelajar mesti menukarnya semasa log masuk pertama. Markah PAJSK & unit kokurikulum boleh dilengkapkan kemudian melalui import atau modul berkaitan.",
      addSuccess: "Pelajar berjaya ditambah.", addFailed: "Gagal menambah pelajar.",
      credentialReveal: "🔑 Kata laluan dipaparkan SEKALI sahaja — salin & berikan kepada pelajar.",
      usernameLabel: "Username", passwordLabel: "Kata laluan", copyCredentials: "Salin kredensial",
      submitAdd: "Tambah Pelajar", submitting: "Menyimpan…",
    },
    sijilPage: { title: "Templat e-Cert", subtitle: "Suai institusi, tajuk sijil, nama & jawatan penandatangan, serta teks cop." },
    sijilClient: {
      instName: "Nama Institusi", certTitle: "Tajuk Sijil", signerName: "Nama Penandatangan", signerPosition: "Jawatan Penandatangan", stampText: "Teks Cop (pilihan)",
      saveTemplate: "Simpan Templat", saving: "Menyimpan...", previewTitle: "Pratonton", previewStudent: "[ Nama Pelajar ]", previewActivity: "[ Nama Aktiviti ]",
      previewIc: "[ No. KP · Kelas ]", previewLevel: "[ Peringkat · Markah PAJSK ]", previewDate: "[ Tarikh ]", previewSerial: "[ No. Siri ]",
    },
    tetapanPage: { title: "Tetapan Formula Markah", subtitle: "Konfigur nilai markah jawatan & peringkat supaya selaras pekeliling PAJSK semasa." },
    tetapanClient: { saveSettings: "Simpan Tetapan", saving: "Menyimpan..." },
  },
  laporan: {
    title: "Laporan SU/NSU", sub: "Laporan mingguan & laporan projek, dipaut terus ke sesi kehadiran berkaitan.", weekly: "Laporan Mingguan", project: "Laporan Projek", noRecords: "Tiada rekod lagi.", downloadVerified: "⬇ Muat turun dokumen disahkan", comment: "Komen",
    tabWeekly: "Laporan Mingguan", tabProject: "Laporan Projek", selectSessionOptional: "— Paut sesi kehadiran (pilihan) —", newProjectOption: "— Projek baharu (pra-program) —", projectNamePlaceholder: "Nama projek (untuk projek baharu)",
    workPlanLabel: "Kertas Kerja (pra)", impactReportLabel: "Laporan Impak (pasca)", financialSummaryPlaceholder: "Ringkasan kewangan (RM)", strengthPlaceholder: "Kekuatan", weaknessPlaceholder: "Kelemahan / penambahbaikan",
    submitForReview: "Hantar untuk Semakan", networkError: "Ralat rangkaian", loading: "Sedang memuat...", attachmentWorkPlan: "📋 kertas kerja", attachmentImpactReport: "📊 laporan impak",
    reportTimePlaceholder: "Masa (cth 2.30-4.30 ptg)", reportActivityPlaceholder: "Aktiviti / laporan ringkas", reportProjectOptionPrefix: "Pasca: ", reportUploadPrompt: "Pra-program: muat naik Kertas Kerja. Pasca-program: pilih projek di atas + muat naik Laporan Impak & isi maklumat.",
    sessionLabel: "Perjumpaan", attachmentLabel: "· 📎 lampiran", reportAttendanceLabel: "Kehadiran", reportViewSession: "Lihat sesi →", suNsuOnly: "Hanya untuk SU / NSU.",
  },
  insights: {
    title: "Analitik Pintar", badge: "AI · BERASASKAN DATA", footerNote: "Cerapan dijana automatik daripada data semasa (analitik berasaskan peraturan).",
    aiLabel: "Ringkasan AI", aiLoading: "Menjana ringkasan…",
    kpiPajskAvg: "Purata PAJSK T6", kpiGradeA: "Pelajar Gred A", kpiAvgAttendance: "Purata Kehadiran", kpiPendingActions: "Menunggu Tindakan",
    unitMarksSuffix: "/ 100 markah", studentsSuffix: "pelajar", noIssues: "Tiada isu dikesan. Semua metrik dalam keadaan baik.",
    avgHigh: (avg, pct) => `Purata markah PAJSK kohort ${avg}/100 — ${pct}% pelajar mencapai Gred A.`,
    avgLow: (avg) => `Purata markah PAJSK kohort ${avg}/100 (di bawah 40) — perlu pemantauan rapi.`,
    attendanceHighest: (unit, pct) => `Kehadiran tertinggi: ${unit} (${pct}%).`,
    attendanceLowest: (unit, pct) => `Kehadiran terendah: ${unit} (${pct}%) — di bawah 70%, disarankan intervensi.`,
    notSelected: (n) => `${n} rekod unit belum mempunyai pilihan T6 — ingatkan pelajar melengkapkan pendaftaran.`,
    pendingActionsText: (n) => `${n} item menunggu tindakan guru (pertukaran, cadangan jawatan, pencapaian, aktiviti, laporan).`,
  },
  analitik: {
    pageTitle: "Analitik Unit Seliaan", back: "← Kembali", scopeSchool: "Skop: Seluruh Sekolah",
    scopeUnit: (units) => `Skop: ${units}`, noUnit: "tiada unit",
    exportExcel: "⬇ Eksport Excel", exportPdf: "⬇ Eksport PDF",
    totalStudents: "Jumlah Pelajar", avgMark: "Purata Markah PAJSK", gradeAStudents: "Pelajar Gred A", avgAttendance: "Purata Kehadiran",
    gradeDist: "Taburan Gred (A–E)", achievementByLevel: "Pencapaian Mengikut Peringkat", attendanceByUnit: "Kehadiran Mengikut Unit (%)", projectReportStatus: "Status Laporan Projek",
    unitSelectionStatus: "Status Pilihan Unit T6", attendanceTrend: "Tren Kehadiran Mengikut Perjumpaan", weeklyReportCompliance: "Pematuhan Laporan Mingguan",
    total: "Jumlah", verified: "Disahkan", pending: "Pending", complianceRate: "Kadar Pematuhan",
    demographicsPrefix: "Demografi: ", crosstabTitle: "Jadual Silang: Jantina × Jenis Kokurikulum", gender: "Jantina",
    noChartData: "Tiada data untuk dipaparkan.", valueIn: "Nilai dalam",
  },
  bantuan: {
    subtitle: "Panduan ringkas penggunaan sistem MyGuru AI.",
    pelajar: {
      title: "Bantuan — Pelajar", back: "/pelajar",
      sections: [
        { h: "Dashboard", isi: ["Lihat markah PAJSK T6, gred, pecahan komponen (Kehadiran, Jawatan, Penglibatan, Pencapaian, Projek), dan carta markah."] },
        { h: "Pencapaian & Aktiviti", isi: ["Isi pencapaian/aktiviti luar + muat naik eviden.", "Aktiviti luar perlu surat & sijil untuk menjana e-Cert selepas guru sahkan."] },
        { h: "Pertukaran Unit", isi: ["Mohon tukar unit; unit dikemas kini selepas guru lulus."] },
        { h: "e-Cert & Butiran Diri", isi: ["Jana e-Cert PDF untuk aktiviti yang diluluskan.", "Cetak Butiran Diri PDF dari dashboard."] },
        { h: "SU/NSU", isi: ["Menu Kehadiran (sesi + QR) dan Laporan (mingguan/projek) jika anda Setiausaha."] },
      ],
    },
    guru: {
      title: "Bantuan — Guru", back: "/guru",
      sections: [
        { h: "Semakan", isi: ["Dashboard memaparkan item Pending dalam skop seliaan anda.", "Lulus/Tolak pertukaran; Sahkan/Kuiri pencapaian, aktiviti luar, laporan & sesi kehadiran."] },
        { h: "Markah", isi: ["Pengesahan mengira semula markah PAJSK T6 pelajar secara automatik."] },
        { h: "Analitik", isi: ["Lihat & eksport analitik kehadiran, projek, laporan (dan demografi jika skop seluruh sekolah)."] },
      ],
    },
    admin: {
      title: "Bantuan — Pentadbir", back: "/admin",
      sections: [
        { h: "Import Data", isi: ["Muat naik Excel PAJSK/Guru; No. IC disimpan sebagai teks; rekod di-upsert."] },
        { h: "Tetapan", isi: ["Konfigur formula markah & templat e-Cert (penandatangan, tajuk, cop)."] },
        { h: "Demografi & Analitik", isi: ["Lengkapkan demografi pelajar; lihat & eksport analitik seluruh kohort."] },
      ],
    },
  },
  tukarKataLaluan: {
    title: "Tukar Kata Laluan",
    subtitleForced: "Sila tukar kata laluan lalai sebelum meneruskan.", subtitleUpdate: "Kemas kini kata laluan anda.",
    currentPassword: "Kata Laluan Semasa", newPassword: "Kata Laluan Baru", confirmPassword: "Sahkan Kata Laluan Baru",
    submit: "Tukar Kata Laluan", submitting: "Menyimpan...",
    mismatchError: "Pengesahan kata laluan tidak sepadan", networkError: "Ralat rangkaian",
  },
};

const en: Dict = {
  langName: { ms: "BM", en: "EN" },
  common: {
    kelab: "Club/Society", sukan: "Sports", uniform: "Uniformed Body", perkhidmatan: "Service Unit", pilihan: "optional",
    jawatan: "Position", peringkat: "Level", status: "Status",
    tingkatan5: "Form 5", tingkatan6: "Form 6", kembali: "Back", dashboard: "Dashboard",
    muatTurun: "Download", disahkan: "Verified", belumDisahkan: "Not Verified", hadir: "Present", tidakHadir: "Absent",
    statusBelumPilih: "Not Selected", statusMohonTukar: "Change Requested", statusKekal: "Retained",
    tiadaData: "No data",
    simpan: "Save", menyimpan: "Saving…", padam: "Delete", memadam: "Deleting…", batal: "Cancel",
    selesai: "Done", aktif: "Active", ralatRangkaian: "Network error.",
    kaum: { melayu: "Malay", cina: "Chinese", india: "Indian", lainLain: "Other" },
    agama: { islam: "Islam", buddha: "Buddhist", hindu: "Hindu", kristian: "Christian", lainLain: "Other" },
    jawatanKoko: {
      guruPenasihat: "Adviser Teacher", penolongKetuaGP: "Deputy Head Adviser", ketuaGP: "Head Adviser Teacher",
      penolongSU: "Deputy Co-curriculum Secretary", pemantauKUPP: "Monitor (KUPP)", penyelaras: "Co-curriculum Coordinator",
    },
    subRolePelajar: { pelajar: "Regular student", su: "Secretary (SU)", nsu: "Deputy Secretary (NSU)" },
    perananUnit: { penasihat: "Adviser", ketuaPenasihat: "Head Adviser" },
    sortToggle: { newest: "Newest first", oldest: "Oldest first", ariaLabel: "Sort by date" },
    modalClose: "Close",
  },
  pajsk: {
    kehadiran: "Attendance", jawatan: "Position", penglibatan: "Participation", pencapaian: "Achievement",
    projekJawatan: "Project — Position", projekPeringkat: "Project — Level", ekstra: "Extra-curricular (bonus)",
  },
  header: { roleStudent: "Student", roleTeacher: "Advisor Teacher", roleAdmin: "Administrator", help: "Help", logout: "Log Out", notifications: "Notifications", theme: "Toggle light/dark mode", chatbot: "Chatbot" },
  chrome: {
    notifTitle: "Notifications", notifEmpty: "No notifications.",
    tindakanLabel: "Actions", tindakanTitle: "Items awaiting action",
    agentChat: {
      subtitle: "Co-curriculum assistant", inputPlaceholder: "Type a message…",
      sessionExpired: "Session expired. Please log in again.", genericError: "Sorry, something went wrong.",
      networkError: "Network error. Try again.", noAnswer: "(no answer)",
      proposalsSuffix: "proposal(s) sent for approval",
      greeting: {
        Pelajar: "Hi! I'm MyGuru AI. Ask me about your PAJSK score, component breakdown, or your units.",
        Guru: "Hi! I'm MyGuru AI. I can help check pending items, unit analytics, and draft approval suggestions.",
        Admin: "Hi! I'm MyGuru AI. Ask me about cohort analytics, demographics, or pending actions.",
      },
      suggestions: {
        Pelajar: ["What's my PAJSK score?", "What's my attendance mark?", "Explain the PAJSK formula"],
        Guru: ["How many items await review?", "Show attendance analytics", "Explain the PAJSK formula"],
        Admin: ["How many items await action?", "Show demographic analytics", "School attendance analytics"],
      },
    },
  },
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
    livePending: {
      title: "Pending Actions (Live)", updatedAt: "Updated:", autoOn: "Auto: ON", autoOff: "Auto: OFF",
      loading: "Loading…", noItems: "✓ No items pending action.", total: "total",
      labels: {
        pencapaian: "Achievement", aktivitiLuar: "External Activity", pertukaran: "Unit Transfer",
        laporanMingguan: "Weekly Report", laporanProjek: "Project Report",
        sesiKehadiran: "Attendance Session", cadanganJawatan: "Position Suggestion",
      },
    },
    reviewPanel: {
      networkError: "Network error", emptyAll: "🎉 No items awaiting action. Everything has been reviewed.",
      unitTransferTitle: "Unit Transfer Requests", positionSuggestionTitle: "Top Position Suggestions",
      achievementTitle: "Achievements Awaiting Verification", externalActivityTitle: "External Activities Awaiting Verification",
      attendanceSessionTitle: "Unverified Attendance Sessions",
      weeklyReportTitle: "Weekly Reports", projectReportTitle: "Project Reports",
      approve: "Approve", reject: "Reject", confirm: "Confirm", query: "Query",
      rejectReasonPrompt: "Reason for rejection (optional):", queryCommentPrompt: "Query comment:",
      evidenceComplete: "Evidence complete (letter + certificate)", evidenceIncomplete: "⚠ Evidence incomplete",
      marksPlaceholder: "Marks", aiSuggestTitle: "Mark suggested by AI based on level (rubric §5.5). Adjustable before confirming.",
    },
    cadanganAiPanel: {
      title: "🤖 AI Suggestions", pendingCountTpl: "{n} pending", sortNewest: "Newest first", sortOldest: "Oldest first",
      sortAriaLabel: "Sort by date",
      descPrefix: "Suggestions are generated by MyGuru AI. No marks, approvals, or e-Certs change until you",
      descBold: "approve", descSuffix: "it here.",
      emptyState: "No AI suggestions awaiting approval.", suggestedLabel: "Suggested:",
      approveBtn: "Approve", rejectBtn: "Reject", rejectPrompt: "Reason for rejection (optional):", networkError: "Network error",
      jenis: { unitTransfer: "Unit Transfer", achievement: "Achievement Verification", recalc: "Recalculate Marks", ecert: "Generate e-Cert" },
    },
    senaraiAhliTabs: { tabsAriaLabel: "Supervised units", marksComputed: "marks computed", marksNotYet: "no marks yet" },
    jawatanAssign: { placeholder: "— Assign —", assignTitle: "Assign position", networkError: "Network error." },
    pemilihan: {
      back: "← Back to Dashboard", title: "Select Students for Competition / Sports",
      subtitle: "Select students to represent at Zone/District, State, National, or International level. Each selection creates an entry Awaiting Verification — marks & e-Cert are given after the letter & certificate are uploaded and verified.",
      noStudents: "No students in your supervised scope.",
      detailsTitle: "Competition Details", competitionName: "Competition / Sport Name",
      competitionNamePlaceholder: "e.g. MSSD Volleyball Championship",
      level: "Level", dateOptional: "Date (optional)",
      selectStudents: "Select Students", selectedSuffix: "selected", searchPlaceholder: "Search name / class / sport…",
      selectAll: "Select all", noMatch: "No matching students.", submitBtnTpl: "Select {n} Student(s)", submittingBtn: "Processing…",
      footerNote: "Entries will have status “Awaiting Verification”. Level marks are given once the certificate is verified.",
      errNameRequired: "Enter the competition name.", errNoSelection: "Select at least one student.",
      errGeneric: "Error processing.", networkError: "Network error.",
      levels: { zonDaerah: "Zone/District", daerah: "District", negeri: "State", kebangsaan: "National", antarabangsa: "International" },
    },
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
    pelajarDetail: {
      backToList: "← Student List", downloadPdf: "⬇ Download PDF", viewPdf: "👁 View PDF", attendanceLabel: "Attendance",
      participationTitle: "Participation & Marks (F6)", notRegistered: "Not registered in any unit yet.", totalLabel: "Total",
      breakdownTitle: "PAJSK Score Breakdown (F6)", assessmentComponent: "Assessment Component", marksCol: "Marks",
      achievementsTitle: "Achievements & Activities",
    },
    back: "← Back", backToGuru: "← Back to Manage Teachers", backToPelajarList: "← Back to Student List", backToDashboard: "← Back to Dashboard",
    analitikPage: { title: "Overall Cohort Analytics", subtitle: "Grades, marks, attendance, achievements, projects, reports & demographics school-wide." },
    demografiPage: { subtitle: "Complete student Gender, Race & Religion for demographic analytics.", colGender: "Gender", colRace: "Race", colReligion: "Religion" },
    guruPage: { title: "Manage Teachers & Advisers", subtitle: "Assign co-curriculum position and supervised units (Club/Sport/Uniformed Body) for each teacher. Only units with an adviser can be applied for by students." },
    guruClient: {
      statusAktif: "Active", unitDiselia: "Supervised Units (Club / Sport / Uniformed Body / Service Unit)",
      noUnitAssigned: "No unit assigned. This teacher cannot view/approve any students.",
      unitNamePlaceholder: "Unit name (e.g. Computer Club)", addUnit: "➕ Add unit",
      deleteConfirmTpl: `Delete teacher "{nama}"?\n\nThis action is PERMANENT and will delete the teacher's login account and unit assignments. Cannot be undone.`,
      deleteFailed: "Failed to delete teacher.", saved: "✓ Saved", save: "Save", deleteBtn: "Delete", deleting: "Deleting…",
    },
    guruTambahPage: { title: "Add New Teacher", subtitle: "Register a new teacher/adviser with co-curriculum position and supervised units. The system will create a login account for this teacher automatically." },
    guruForm: {
      fullName: "Full name *", fullNamePlaceholder: "e.g. Mr. Ahmad bin Ali", email: "Email (for login) *", emailPlaceholder: "teacher@school.edu.my",
      icOptional: "IC Number (optional)", icPlaceholder: "12 digits", position: "Co-curriculum Position *",
      unitHint: "Teachers can only view & approve students in units assigned here. You may add more than one unit.",
      credentialNote: "A login account is created automatically (username = email). A unique password is generated and shown only once after saving; the teacher must change it on first login.",
      credentialReveal: "🔑 Password shown ONCE only — copy & give it to the teacher.", usernameLabel: "Username", passwordLabel: "Password",
      copyCredentials: "Copy credentials", submitAdd: "Add Teacher", submitting: "Saving…",
      addSuccess: "Teacher added successfully.", addFailed: "Failed to add teacher.",
    },
    importPage: { title: "Import Data (CSV/Excel)", subtitle: "Upload a PAJSK file (students) or teacher registration form. IC numbers are read as text (full digits preserved). Existing records are updated (upsert)." },
    importClient: {
      pajskTab: "PAJSK (Students)", guruTab: "Teacher Registration",
      choosePajskInfo: "The PAJSK file is previewed first — differences are shown before any marks change.",
      guruUpsertInfo: "Teacher records are updated directly (upsert).",
      previewBtn: "Preview Differences", uploadBtn: "Upload & Import", processing: "Processing...", previewTitle: "Preview Differences",
      totalRecords: "Total records", newLabel: "New", changedLabel: "Changed", unchangedLabel: "Unchanged",
      warningPrefix: "⚠️ Warning: Confirming will write", warningWillRecalcTpl: "{n1} records and recalculate marks for {n2} students",
      warningSuffix: "This operation changes many students' marks at once and cannot be undone automatically.",
      studentCol: "Student", statusCol: "Status", changesCol: "Changes", parseWarningsTpl: "{n} parsing warning(s) (problem records skipped).",
      cancel: "Cancel", confirmImport: "Confirm & Import + Recalculate", confirming: "Confirming...",
      importDoneTpl: "✓ Import complete: {ok}/{total} records written", recalcedTpl: "; {n} students recalculated.",
      warningsCountTpl: "{n} warning(s)", historyTitle: "Import History (Audit)", noHistory: "No import records yet.",
      dateCol: "Date", fileCol: "File", typeCol: "Type", recordsCol: "Records", newChangedCol: "New / Changed",
      pelajarBaruTab: "New Students (No Units)",
      pelajarBaruInfo: "Create new student accounts (Name/Class/IC only) — students register their own Club/Sport/Uniformed Body/Service Unit after first login, subject to teacher/admin approval.",
      pelajarBaruWarningTpl: "Confirming will create {n} new student account(s). First login: IC No. as both username AND password (must be changed after login). No units or PAJSK marks are created — students register themselves afterwards, subject to teacher/admin approval.",
      noFileSelected: "Please choose an Excel/CSV file first (click \"Choose File\" above).",
    },
    kehadiranPage: {
      title: "Attendance — Per Meeting", subtitle: "Click any row to see the list of present/absent names.",
      totalMeetings: "Total Meetings", avgAttendance: "Avg. Attendance", notVerified: "Not Verified",
      unitLabel: "Unit", allUnits: "All units", typeLabel: "Type", allTypes: "All", filterBtn: "Filter",
      resetBtn: "Reset", listTitle: "Meeting List", noSessions: "No attendance sessions for this filter.",
    },
    kehadiranTable: {
      colUnit: "Unit", colType: "Type", colMeeting: "Meeting", colDate: "Date", colPresent: "Present",
      colPercent: "%", colStatus: "Status", meeting: "Meeting", loading: "Loading…", presentCount: "present",
      noAttendanceRecords: "No attendance records marked.", failedDetail: "Failed to load details.", present: "✓ Present", absent: "✗ Absent",
    },
    editPelajarPage: { title: "Edit Student", subtitle: "Update the student's profile information. IC number (login username) cannot be changed. PAJSK marks & co-curriculum units are managed via the related module / import." },
    pelajarForm: {
      fullName: "Full name *", icNoDisabled: "IC Number (cannot be changed)", classT6: "Form 6 Class", role: "Role",
      gender: "Gender", race: "Race", religion: "Religion", email: "Email", phone: "Phone Number", accountActive: "Account active (can log in)",
      done: "Done", saveChanges: "Save Changes", saving: "Saving…",
      updateSuccess: "Information updated.", updateFailed: "Failed to update.",
    },
    tambahPelajarPage: { title: "Add New Student", subtitleBefore: "Register a new F6 student individually. The system will create a login account (IC number) automatically. For bulk entry, use", subtitleLink: "Import Data" },
    tambahPelajarForm: {
      icForLogin: "IC Number (for login) *", classPlaceholder: "e.g. F6 Upper Science 1", emailOptional: "Email (optional)", phoneOptional: "Phone Number (optional)",
      credentialNote: "A login account is created automatically (username = IC number). A unique password is generated and shown only once after saving; the student must change it on first login. PAJSK marks & co-curriculum units can be completed later via import or the related module.",
      addSuccess: "Student added successfully.", addFailed: "Failed to add student.",
      credentialReveal: "🔑 Password shown ONCE only — copy & give it to the student.",
      usernameLabel: "Username", passwordLabel: "Password", copyCredentials: "Copy credentials",
      submitAdd: "Add Student", submitting: "Saving…",
    },
    sijilPage: { title: "e-Cert Template", subtitle: "Customize institution, certificate title, signer name & position, and stamp text." },
    sijilClient: {
      instName: "Institution Name", certTitle: "Certificate Title", signerName: "Signer Name", signerPosition: "Signer Position", stampText: "Stamp Text (optional)",
      saveTemplate: "Save Template", saving: "Saving...", previewTitle: "Preview", previewStudent: "[ Student Name ]", previewActivity: "[ Activity Name ]",
      previewIc: "[ IC No. · Class ]", previewLevel: "[ Level · PAJSK Marks ]", previewDate: "[ Date ]", previewSerial: "[ Serial No. ]",
    },
    tetapanPage: { title: "Mark Formula Settings", subtitle: "Configure position & level mark values in line with current PAJSK circular." },
    tetapanClient: { saveSettings: "Save Settings", saving: "Saving..." },
  },
  laporan: {
    title: "SU/NSU Reports", sub: "Weekly & project reports, linked directly to related attendance sessions.", weekly: "Weekly Reports", project: "Project Reports", noRecords: "No records yet.", downloadVerified: "⬇ Download verified document", comment: "Comment",
    tabWeekly: "Weekly Reports", tabProject: "Project Reports", selectSessionOptional: "— Link attendance session (optional) —", newProjectOption: "— New project (pre-program) —", projectNamePlaceholder: "Project name (for a new project)",
    workPlanLabel: "Work Plan (pre)", impactReportLabel: "Impact Report (post)", financialSummaryPlaceholder: "Financial summary (RM)", strengthPlaceholder: "Strengths", weaknessPlaceholder: "Weaknesses / improvements",
    submitForReview: "Submit for Review", networkError: "Network error", loading: "Loading...", attachmentWorkPlan: "📋 work plan", attachmentImpactReport: "📊 impact report",
    reportTimePlaceholder: "Time (e.g. 2.30-4.30 PM)", reportActivityPlaceholder: "Activity / short report", reportProjectOptionPrefix: "Post: ", reportUploadPrompt: "Pre-program: upload a Work Plan. Post-program: choose a project above + upload Impact Report & fill in details.",
    sessionLabel: "Meeting", attachmentLabel: "· 📎 attachment", reportAttendanceLabel: "Attendance", reportViewSession: "View session →", suNsuOnly: "For Secretary / Deputy Secretary only.",
  },
  insights: {
    title: "Smart Analytics", badge: "AI · DATA-DRIVEN", footerNote: "Insights are generated automatically from current data (rule-based analytics).",
    aiLabel: "AI Summary", aiLoading: "Generating summary…",
    kpiPajskAvg: "Avg. PAJSK (F6)", kpiGradeA: "Grade A Students", kpiAvgAttendance: "Avg. Attendance", kpiPendingActions: "Pending Actions",
    unitMarksSuffix: "/ 100 marks", studentsSuffix: "students", noIssues: "No issues detected. All metrics are healthy.",
    avgHigh: (avg, pct) => `Cohort average PAJSK score ${avg}/100 — ${pct}% of students achieved Grade A.`,
    avgLow: (avg) => `Cohort average PAJSK score ${avg}/100 (below 40) — close monitoring needed.`,
    attendanceHighest: (unit, pct) => `Highest attendance: ${unit} (${pct}%).`,
    attendanceLowest: (unit, pct) => `Lowest attendance: ${unit} (${pct}%) — below 70%, intervention recommended.`,
    notSelected: (n) => `${n} unit record(s) still lack an F6 selection — remind students to complete registration.`,
    pendingActionsText: (n) => `${n} item(s) awaiting teacher action (transfers, position suggestions, achievements, activities, reports).`,
  },
  analitik: {
    pageTitle: "Supervised Unit Analytics", back: "← Back", scopeSchool: "Scope: Whole School",
    scopeUnit: (units) => `Scope: ${units}`, noUnit: "no unit",
    exportExcel: "⬇ Export Excel", exportPdf: "⬇ Export PDF",
    totalStudents: "Total Students", avgMark: "Avg. PAJSK Score", gradeAStudents: "Grade A Students", avgAttendance: "Avg. Attendance",
    gradeDist: "Grade Distribution (A–E)", achievementByLevel: "Achievements by Level", attendanceByUnit: "Attendance by Unit (%)", projectReportStatus: "Project Report Status",
    unitSelectionStatus: "F6 Unit Selection Status", attendanceTrend: "Attendance Trend by Meeting", weeklyReportCompliance: "Weekly Report Compliance",
    total: "Total", verified: "Verified", pending: "Pending", complianceRate: "Compliance Rate",
    demographicsPrefix: "Demographics: ", crosstabTitle: "Crosstab: Gender × Co-curriculum Type", gender: "Gender",
    noChartData: "No data to display.", valueIn: "Value in",
  },
  bantuan: {
    subtitle: "Quick guide to using the MyGuru AI system.",
    pelajar: {
      title: "Help — Student", back: "/pelajar",
      sections: [
        { h: "Dashboard", isi: ["View your PAJSK F6 score, grade, component breakdown (Attendance, Position, Participation, Achievement, Project), and score chart."] },
        { h: "Achievements & Activities", isi: ["Submit achievements/external activities + upload evidence.", "External activities need a letter & certificate to generate an e-Cert after teacher approval."] },
        { h: "Unit Transfer", isi: ["Apply to change unit; the unit updates after teacher approval."] },
        { h: "e-Cert & Personal Details", isi: ["Generate a PDF e-Cert for approved activities.", "Print your Personal Details PDF from the dashboard."] },
        { h: "SU/NSU", isi: ["Attendance menu (session + QR) and Reports (weekly/project) if you are a Secretary."] },
      ],
    },
    guru: {
      title: "Help — Teacher", back: "/guru",
      sections: [
        { h: "Review", isi: ["The dashboard shows Pending items in your supervised scope.", "Approve/Reject transfers; Confirm/Query achievements, external activities, reports & attendance sessions."] },
        { h: "Marks", isi: ["Confirming automatically recalculates a student's PAJSK F6 score."] },
        { h: "Analytics", isi: ["View & export attendance, project, and report analytics (and demographics if school-wide scope)."] },
      ],
    },
    admin: {
      title: "Help — Administrator", back: "/admin",
      sections: [
        { h: "Import Data", isi: ["Upload PAJSK/Teacher Excel files; IC numbers are stored as text; records are upserted."] },
        { h: "Settings", isi: ["Configure the mark formula & e-Cert template (signer, title, stamp)."] },
        { h: "Demographics & Analytics", isi: ["Complete student demographics; view & export cohort-wide analytics."] },
      ],
    },
  },
  tukarKataLaluan: {
    title: "Change Password",
    subtitleForced: "Please change your default password before continuing.", subtitleUpdate: "Update your password.",
    currentPassword: "Current Password", newPassword: "New Password", confirmPassword: "Confirm New Password",
    submit: "Change Password", submitting: "Saving...",
    mismatchError: "Password confirmation does not match", networkError: "Network error",
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
