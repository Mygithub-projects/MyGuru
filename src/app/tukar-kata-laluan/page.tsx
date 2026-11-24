import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { TukarKataLaluanForm } from "./TukarKataLaluanForm";

export default async function TukarKataLaluanPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { t } = await getT();

  return (
    <div className="flex flex-1 items-center justify-center ez-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-white">
          <Image src="/logo-ezkoko.webp" alt="Logo EzKoko KTEDM" width={96} height={102} className="mb-3 h-24 w-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)]" />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase italic text-white">{t.tukarKataLaluan.title}</h1>
          <p className="text-sm text-white/85">
            {session.mustChangePw ? t.tukarKataLaluan.subtitleForced : t.tukarKataLaluan.subtitleUpdate}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <TukarKataLaluanForm
            t={{ ...t.tukarKataLaluan, showPassword: t.login.showPassword, hidePassword: t.login.hidePassword }}
          />
        </div>
        {!session.mustChangePw && (
          <Link href={session.role === "Admin" ? "/admin" : session.role === "Guru" ? "/guru" : "/pelajar"}
            className="mt-4 block text-center text-sm text-white/85 hover:text-white">← Kembali</Link>
        )}
      </div>
    </div>
  );
}
