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

// PATCH /api/crm/contacts/[id] — update a contact
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { first_name, last_name, role, email, linkedin_url, phone, location, bio, notes } = body;

  if (first_name !== undefined && !first_name?.trim()) {
    return NextResponse.json({ error: "first_name cannot be empty" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (first_name !== undefined) updates.first_name = first_name.trim();
  if (last_name !== undefined) updates.last_name = last_name?.trim() ?? null;
  if (role !== undefined) updates.role = role?.trim() ?? null;
  if (email !== undefined) updates.email = email?.trim() ?? null;
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url?.trim() ?? null;
  if (phone !== undefined) updates.phone = phone?.trim() ?? null;
  if (location !== undefined) updates.location = location?.trim() ?? null;
  if (bio !== undefined) updates.bio = bio?.trim() ?? null;
  if (notes !== undefined) updates.notes = notes?.trim() ?? null;

  const { data, error } = await supabaseAdmin
    .from("investor_contacts")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
