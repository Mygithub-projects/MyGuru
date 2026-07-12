import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Landing } from "@/components/Landing";

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === "Admin") redirect("/admin");
    if (session.role === "Guru") redirect("/guru");
    redirect("/pelajar");
  }
  const institusi = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";
  return <Landing institusi={institusi} />;
}
