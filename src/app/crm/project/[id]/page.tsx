import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectDetailClient from "./ProjectDetailClient";

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

  return (
    <ProjectDetailClient
      project={project}
      members={members ?? []}
      investors={investors ?? []}
      invitations={invitations ?? []}
      role={member.role}
      currentUserId={user.id}
    />
  );
}
