import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getScAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("sc_admin").eq("id", user.id).single();
  if (!profile?.sc_admin) return null;
  return user;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols: string[] = [];
    let inQuotes = false;
    let current = "";
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    cols.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
    rows.push(row);
  }

  return rows;
}

function mapRow(row: Record<string, string>) {
  // Flexible field mapping — covers HubSpot export and common variations
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k] ?? row[k.replace(/ /g, "_")] ?? row[k.replace(/_/g, " ")] ?? "";
      if (v) return v.trim();
    }
    return null;
  };

  const fullName = get("contact name", "full_name", "name", "contact_name");
  let firstName = get("first name", "first_name", "firstname") ?? "";
  let lastName  = get("last name",  "last_name",  "lastname")  ?? null;
  if (!firstName && fullName) {
    const parts = fullName.split(" ");
    firstName = parts[0];
    lastName  = parts.slice(1).join(" ") || null;
  }

  if (!firstName) return null;

  // Map HubSpot lifecycle / deal stage to SC stage
  const rawStage = (get("lifecycle stage", "deal stage", "stage", "status") ?? "").toLowerCase();
  let stage = "connection_request";
  if (rawStage.includes("customer") || rawStage.includes("sale") || rawStage.includes("won")) stage = "sale";
  else if (rawStage.includes("follow") || rawStage.includes("proposal")) stage = "follow_up";
  else if (rawStage.includes("meeting") || rawStage.includes("call")) stage = "call_booked";
  else if (rawStage.includes("qualif") || rawStage.includes("engaged") || rawStage.includes("connect")) stage = "engaged";
  else if (rawStage.includes("lost") || rawStage.includes("closed lost")) stage = "lost";

  return {
    first_name:    firstName,
    last_name:     lastName,
    email:         get("email", "email address"),
    linkedin_url:  get("linkedin", "linkedin url", "linkedin_url"),
    company_name:  get("company", "company name", "organization"),
    role:          get("job title", "jobtitle", "title", "role"),
    location:      get("city", "country", "location"),
    stage,
    notes:         get("notes", "description", "note"),
    hubspot_id:    get("record id", "hubspot id", "contact id", "hs_object_id"),
    source:        "hubspot_import",
  };
}

// POST /api/crm/prospects/import
// Body: { csv?: string, sheet_url?: string }
export async function POST(req: NextRequest) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  let csvText: string = body.csv ?? "";

  // Try to fetch Google Sheets as CSV
  if (!csvText && body.sheet_url) {
    const url = String(body.sheet_url);
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 });
    const sheetId = idMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const res = await fetch(csvUrl);
    if (!res.ok) return NextResponse.json({ error: "Could not fetch sheet — make sure it is publicly readable (Anyone with the link → Viewer)" }, { status: 400 });
    csvText = await res.text();
  }

  if (!csvText) return NextResponse.json({ error: "Provide csv or sheet_url" }, { status: 400 });

  const rows = parseCSV(csvText);
  const prospects = rows.map(mapRow).filter(Boolean) as ReturnType<typeof mapRow>[];

  if (prospects.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sc_prospects")
    .upsert(prospects, { onConflict: "hubspot_id", ignoreDuplicates: false })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: data?.length ?? 0, total: prospects.length });
}