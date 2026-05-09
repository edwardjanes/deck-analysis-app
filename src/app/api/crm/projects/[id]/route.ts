import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getProjectWithRole(projectId: string, userId: string) {
  const { data: member } = await supabaseAdmin
    .from("raise_project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();
  return member?.role ?? null;
}

// GET /api/crm/projects/[id] — project detail + members + investors
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getProjectWithRole(params.id, user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: project }, { data: members }, { data: investors }, { data: invitations }] = await Promise.all([
    supabaseAdmin.from("raise_projects").select("*").eq("id", params.id).single(),
    supabaseAdmin.from("raise_project_members").select("*, profiles(first_name, last_name)").eq("project_id", params.id),
    supabaseAdmin.from("pipeline_investors").select("*").eq("raise_project_id", params.id).eq("archived", false).order("updated_at", { ascending: false }),
    supabaseAdmin.from("raise_project_invitations").select("id, email, role, accepted_at, expires_at, created_at").eq("project_id", params.id).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ project, members, investors, invitations, role });
}

// PATCH /api/crm/projects/[id] — update project (owner only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabaseAdmin.from("raise_projects").select("owner_id").eq("id", params.id).single();
  if (!project || project.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowed = ["name", "company_name", "description", "target_raise", "stage", "status"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updates[key] = body[key]; }

  const { data, error } = await supabaseAdmin.from("raise_projects").update(updates).eq("id", params.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}
