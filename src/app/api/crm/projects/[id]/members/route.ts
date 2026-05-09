import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// PATCH /api/crm/projects/[id]/members?userId=xxx — update role
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabaseAdmin.from("raise_projects").select("owner_id").eq("id", params.id).single();
  if (!project || project.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("raise_project_members").update({ role }).eq("project_id", params.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/crm/projects/[id]/members?userId=xxx — remove member
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabaseAdmin.from("raise_projects").select("owner_id").eq("id", params.id).single();
  if (!project || project.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const { error } = await supabaseAdmin.from("raise_project_members").delete().eq("project_id", params.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
