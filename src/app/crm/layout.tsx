import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CrmShell from "./CrmShell";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, crm_access")
    .eq("id", user.id)
    .single();

  if (!profile?.crm_access) {
    redirect("/crm-upgrade");
  }

  return (
    <CrmShell firstName={profile?.first_name ?? user.email?.split("@")[0] ?? "there"}>
      {children}
    </CrmShell>
  );
}
