import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TukarKataLaluanForm } from "./TukarKataLaluanForm";

export default async function TukarKataLaluanPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-ink via-ink-2 to-brand-dark px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-white">
          <Image src="/logo-ktedm.jpeg" alt="Logo" width={64} height={64} className="mb-3 rounded-full bg-white p-1 shadow-lg ring-2 ring-white/30" />
          <h1 className="text-xl font-bold text-white">Tukar Kata Laluan</h1>
          <p className="text-sm text-white/85">
            {session.mustChangePw ? "Sila tukar kata laluan lalai sebelum meneruskan." : "Kemas kini kata laluan anda."}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <TukarKataLaluanForm />
        </div>
      </div>
    </div>
  );
}
