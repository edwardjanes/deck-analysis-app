import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectDetailClient from "./ProjectDetailClient";
import { RaiseProject, PipelineInvestor, ProjectRole } from "@/lib/crm/types";

type Member = { id: string; user_id: string; role: string; profiles: { first_name: string | null; last_name: string | null } | null };
type Invitation = { id: string; email: string; role: string; accepted_at: string | null; expires_at: string; created_at: string };

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabaseAdmin
    .from("raise_project_members")
    .select("role")
    .eq("project_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!member) notFound();

  const [{ data: project }, { data: members }, { data: investors }, { data: invitations }] = await Promise.all([
    supabaseAdmin.from("raise_projects").select("*").eq("id", params.id).single(),
    supabaseAdmin.from("raise_project_members").select("*, profiles(first_name, last_name)").eq("project_id", params.id),
    supabaseAdmin.from("pipeline_investors").select("*").eq("raise_project_id", params.id).eq("archived", false).order("updated_at", { ascending: false }),
    supabaseAdmin.from("raise_project_invitations").select("id, email, role, accepted_at, expires_at, created_at").eq("project_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (!project) notFound();

  const typedMembers = ((members ?? []) as { id: string; user_id: string; role: string; profiles: unknown }[]).map(m => ({
    ...m,
    profiles: (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as { first_name: string | null; last_name: string | null } | null,
  })) as Member[];

  return (
    <ProjectDetailClient
      project={project as RaiseProject}
      members={typedMembers}
      investors={(investors ?? []) as PipelineInvestor[]}
      invitations={(invitations ?? []) as Invitation[]}
      role={member.role as ProjectRole}
      currentUserId={user.id}
    />
  );
}
