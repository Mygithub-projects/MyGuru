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
    genderDist: string; noDemographics: string;
    quickActions: string;
    actManageStudents: string; actAddStudent: string; actAddTeacher: string; actImport: string;
    actFormula: string; actDemographics: string; actManageTeachers: string; actAttendance: string;
    actCertTemplate: string; actAnalytics: string; seeAlso: string; teacherView: string; studentView: string;
    pelajarTitle: string; pelajarSub: string; downloadAll: string;
    colUnits: string; colPajsk: string; colStatus: string; colActions: string; detail: string; edit: string;
  };
  laporan: { title: string; sub: string; weekly: string; project: string; noRecords: string; downloadVerified: string; comment: string };
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
    genderDist: "Taburan Jantina", noDemographics: "Data demografi belum dilengkapkan. Sila kemas kini melalui modul Demografi.",
    quickActions: "Tindakan Pantas",
    actManageStudents: "Urus Pelajar", actAddStudent: "➕ Tambah Pelajar", actAddTeacher: "➕ Tambah Guru", actImport: "Import Data (CSV/Excel)",
    actFormula: "Tetapan Formula Markah", actDemographics: "Kemas Kini Demografi", actManageTeachers: "Urus Guru & Penasihat", actAttendance: "Kehadiran (Setiap Perjumpaan)",
    actCertTemplate: "Templat e-Cert", actAnalytics: "📊 Analitik Keseluruhan", seeAlso: "Lihat juga:", teacherView: "Pandangan Guru", studentView: "Pandangan Pelajar",
    pelajarTitle: "Urus Pelajar", pelajarSub: "Senarai pelajar T6 (markah, nama, kelab, sukan, badan beruniform terkini). Klik Butiran untuk paparan penuh & muat turun PDF setiap pelajar.", downloadAll: "⬇ Muat turun semua (Excel)",
    colUnits: "Kelab / Sukan / BB", colPajsk: "PAJSK T6", colStatus: "Status", colActions: "Tindakan", detail: "Butiran", edit: "Edit",
  },
  laporan: { title: "Laporan SU/NSU", sub: "Laporan mingguan & laporan projek, dipaut terus ke sesi kehadiran berkaitan.", weekly: "Laporan Mingguan", project: "Laporan Projek", noRecords: "Tiada rekod lagi.", downloadVerified: "⬇ Muat turun dokumen disahkan", comment: "Komen" },
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
    genderDist: "Gender Distribution", noDemographics: "Demographic data not yet completed. Please update via the Demographics module.",
    quickActions: "Quick Actions",
    actManageStudents: "Manage Students", actAddStudent: "➕ Add Student", actAddTeacher: "➕ Add Teacher", actImport: "Import Data (CSV/Excel)",
    actFormula: "Mark Formula Settings", actDemographics: "Update Demographics", actManageTeachers: "Manage Teachers & Advisors", actAttendance: "Attendance (Per Meeting)",
    actCertTemplate: "e-Cert Template", actAnalytics: "📊 Overall Analytics", seeAlso: "See also:", teacherView: "Teacher View", studentView: "Student View",
    pelajarTitle: "Manage Students", pelajarSub: "F6 student list (latest marks, name, club, sport, uniformed body). Click Details for the full view & per-student PDF download.", downloadAll: "⬇ Download all (Excel)",
    colUnits: "Club / Sport / UB", colPajsk: "PAJSK F6", colStatus: "Status", colActions: "Actions", detail: "Details", edit: "Edit",
  },
  laporan: { title: "SU/NSU Reports", sub: "Weekly & project reports, linked directly to related attendance sessions.", weekly: "Weekly Reports", project: "Project Reports", noRecords: "No records yet.", downloadVerified: "⬇ Download verified document", comment: "Comment" },
};

export const messages: Record<Locale, Dict> = { ms, en };
export function getDict(locale: Locale): Dict {
  return messages[locale] ?? ms;
}
