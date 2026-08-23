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

// POST /api/crm/contacts — create a new contact for a firm
export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { investor_firm_id, first_name, last_name, role, email, linkedin_url, phone, location, bio } = body;
  if (!first_name?.trim()) return NextResponse.json({ error: "first_name is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("investor_contacts")
    .insert({
      investor_firm_id: investor_firm_id ?? null,
      first_name: first_name.trim(),
      last_name: last_name?.trim() ?? null,
      role: role?.trim() ?? null,
      email: email?.trim() ?? null,
      linkedin_url: linkedin_url?.trim() ?? null,
      phone: phone?.trim() ?? null,
      location: location?.trim() ?? null,
      bio: bio?.trim() ?? null,
      source: "manual",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data }, { status: 201 });
}
