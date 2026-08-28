import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/conta/entrar");
  if (!user.isAdmin) redirect("/");

  return <div className="container-page py-10 sm:py-14">{children}</div>;
}
