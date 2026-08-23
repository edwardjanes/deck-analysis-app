import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectsClient from "./ProjectsClient";
import { RaiseProject } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabaseAdmin.from("raise_projects").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabaseAdmin.from("raise_project_members").select("role, raise_projects(*)").eq("user_id", user.id),
  ]);

  const memberProjects = ((memberships ?? []) as { role: string; raise_projects: unknown }[])
    .map(m => {
      const proj = (Array.isArray(m.raise_projects) ? m.raise_projects[0] : m.raise_projects) as RaiseProject;
      return { ...proj, member_role: m.role };
    })
    .filter(p => p.owner_id !== user.id);

  return <ProjectsClient owned={(owned ?? []) as RaiseProject[]} member={memberProjects} />;
}
