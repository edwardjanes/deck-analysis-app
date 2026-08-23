import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getCrmUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("crm_access").eq("id", user.id).single();
  if (!profile?.crm_access) return null;
  return user;
}

// GET /api/crm/projects — list all projects user owns or is member of
export async function GET() {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Owned projects
  const { data: owned } = await supabaseAdmin
    .from("raise_projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Member projects
  const { data: memberships } = await supabaseAdmin
    .from("raise_project_members")
    .select("role, raise_projects(*)")
    .eq("user_id", user.id);

  const memberProjects = (memberships ?? [])
    .map((m: Record<string, unknown>) => ({ ...(m.raise_projects as Record<string, unknown>), member_role: m.role }))
    .filter((p: Record<string, unknown>) => p.owner_id !== user.id);

  return NextResponse.json({ owned: owned ?? [], member: memberProjects });
}

// POST /api/crm/projects — create a project
export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, company_name, description, target_raise, stage } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const { data: project, error } = await supabaseAdmin
    .from("raise_projects")
    .insert({ owner_id: user.id, name, company_name: company_name || null, description: description || null, target_raise: target_raise || null, stage: stage || null })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add owner as member
  await supabaseAdmin.from("raise_project_members").insert({ project_id: project.id, user_id: user.id, role: "owner", invited_by: user.id });

  return NextResponse.json({ project }, { status: 201 });
}
