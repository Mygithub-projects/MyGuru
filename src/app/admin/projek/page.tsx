import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ProjekUrusPage } from "@/components/ProjekUrusPage";

// Akses /admin dihadkan kepada Admin oleh src/proxy.ts.
export default async function AdminProjekPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ProjekUrusPage guru={null} userId={session.userId} />;
}
