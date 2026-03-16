"use server";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect("/map");
  }

  return <AdminShell>{children}</AdminShell>;
}
