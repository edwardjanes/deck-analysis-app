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
  const { data: owner } = await supabaseAdmin
    .from("raise_projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();
  return owner?.owner_id === userId ? "owner" : member?.role ?? null;
}

type CSVRow = Record<string, string>;

function parseCSVContent(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (handles basic cases, not quoted fields with commas)
    const values = line.split(',').map(v => v.trim());
    const row: CSVRow = {};

    headers.forEach((header, idx) => {
      if (idx < values.length) {
        row[header] = values[idx];
      }
    });

    rows.push(row);
  }

  return rows;
}

function parseArrayField(value: string | undefined): string[] {
  if (!value || !value.trim()) return [];
  return value.split(',').map(v => v.trim()).filter(v => v);
}

function parseNumberField(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? null : num;
}

// POST /api/crm/projects/[id]/investors/import — bulk import investors from CSV
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check edit permission
  const role = await getProjectWithRole(params.id, user.id);
  if (role !== "owner" && role !== "editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: "File must be CSV format" }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCSVContent(content);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows in CSV" }, { status: 400 });
    }

    // Validate and prepare rows for insert
    const investors = rows
      .map((row, idx) => {
        const fundName = row.fund_name?.trim() || row['fund name']?.trim();
        if (!fundName) return { error: `Row ${idx + 2}: fund_name is required` };

        return {
          user_id: user.id,
          raise_project_id: params.id,
          fund_name: fundName,
          contact_name: row.contact_name?.trim() || row['contact name']?.trim() || null,
          role: row.role?.trim() || null,
          email: row.email?.trim() || null,
          linkedin_url: row.linkedin_url?.trim() || row['linkedin url']?.trim() || null,
          stage_focus: parseArrayField(row.stage_focus || row['stage focus']),
          geography: parseArrayField(row.geography),
          sector_focus: parseArrayField(row.sector_focus || row['sector focus']),
          check_size_min: parseNumberField(row.check_size_min || row['check size min']),
          check_size_max: parseNumberField(row.check_size_max || row['check size max']),
          thesis_notes: row.thesis_notes?.trim() || row['thesis notes']?.trim() || null,
          stage: "researching" as const,
        };
      })
      .filter(row => !('error' in row));

    // Find validation errors
    const errors = rows
      .map((row, idx) => {
        const fundName = row.fund_name?.trim() || row['fund name']?.trim();
        if (!fundName) return `Row ${idx + 2}: fund_name is required`;
        return null;
      })
      .filter((e): e is string => e !== null);

    if (errors.length > 0) {
      return NextResponse.json({
        error: "CSV validation failed",
        details: errors
      }, { status: 400 });
    }

    // Bulk insert
    const { data, error: insertError } = await supabaseAdmin
      .from("pipeline_investors")
      .insert(investors)
      .select("*");

    if (insertError) {
      return NextResponse.json({
        error: "Failed to import investors",
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: (data ?? []).length,
      investors: data,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}