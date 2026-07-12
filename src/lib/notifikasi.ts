// ===========================================================================
//  Notifikasi — dalam-app (jadual Notifikasi) + adapter luaran sebenar.
//  Saluran luaran aktif HANYA bila env disediakan; jika tidak, ia tidak
//  berbuat apa-apa (graceful no-op). Selaras Notification Agent (§14).
//    - E-mel : SMTP melalui nodemailer (SMTP_HOST, SMTP_PORT, SMTP_USER, ...)
//    - Telegram : Bot API melalui fetch (TELEGRAM_BOT_TOKEN)
// ===========================================================================
import { prisma } from "./prisma";

export type JenisNotifikasi = "info" | "kuiri" | "lulus" | "tolak";

interface NotifInput {
  userId: string;
  tajuk: string;
  mesej: string;
  jenis?: JenisNotifikasi;
  pautan?: string;
}

interface Kenalan {
  email?: string | null;
  telegramChatId?: string | null;
}

export async function notify(input: NotifInput) {
  const rec = await prisma.notifikasi.create({
    data: {
      userId: input.userId,
      tajuk: input.tajuk,
      mesej: input.mesej,
      jenis: input.jenis ?? "info",
      pautan: input.pautan,
    },
  });

  // Selesaikan kenalan penerima untuk saluran luaran
  const kenalan = await resolveKenalan(input.userId);
  await dispatchLuaran(input, kenalan).catch((e) =>
    console.warn("[notifikasi] adapter luaran gagal:", e instanceof Error ? e.message : e)
  );
  return rec;
}

export async function notifyPelajar(pelajarId: string, input: Omit<NotifInput, "userId">) {
  const user = await prisma.user.findFirst({ where: { pelajarId }, select: { id: true } });
  if (!user) return null;
  return notify({ ...input, userId: user.id });
}

/** Notifikasi guru yang menyelia unit tertentu + guru berskop seluruh sekolah. */
export async function notifyGuruUntukUnit(namaUnit: string | null, input: Omit<NotifInput, "userId">) {
  const SELURUH = ["Penyelaras", "PemantauKUPP", "PenolongSU"];
  const guru = await prisma.guru.findMany({
    where: {
      statusAktif: true,
      OR: [
        ...(namaUnit ? [{ kelabDiselia: namaUnit }, { sukanDiselia: namaUnit }, { badanDiselia: namaUnit }] : []),
        { jawatanKoko: { in: SELURUH } },
      ],
    },
    select: { id: true },
  });
  if (guru.length === 0) return;
  const users = await prisma.user.findMany({
    where: { guruId: { in: guru.map((g) => g.id) }, statusAktif: true },
    select: { id: true },
  });
  await Promise.all(users.map((u) => notify({ ...input, userId: u.id })));
}

async function resolveKenalan(userId: string): Promise<Kenalan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, pelajar: { select: { email: true, telegramChatId: true } }, guru: { select: { email: true } } },
  });
  return {
    email: user?.pelajar?.email ?? user?.guru?.email ?? user?.email ?? null,
    telegramChatId: user?.pelajar?.telegramChatId ?? null,
  };
}

async function dispatchLuaran(input: NotifInput, kenalan: Kenalan) {
  await Promise.all([hantarEmel(input, kenalan), hantarTelegram(input, kenalan)]);
}

async function hantarEmel(input: NotifInput, kenalan: Kenalan) {
  if (!process.env.SMTP_HOST || !kenalan.email) return;
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  await transport.sendMail({
    from: process.env.SMTP_FROM || "KoKurikulum <no-reply@ekoko.local>",
    to: kenalan.email,
    subject: `[KoKurikulum] ${input.tajuk}`,
    text: `${input.mesej}${input.pautan ? `\n\n${base}${input.pautan}` : ""}`,
  });
}

async function hantarTelegram(input: NotifInput, kenalan: Kenalan) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = kenalan.telegramChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: `🔔 ${input.tajuk}\n${input.mesej}` }),
  });
}

export async function bilangBelumDibaca(userId: string): Promise<number> {
  return prisma.notifikasi.count({ where: { userId, dibaca: false } });
}
