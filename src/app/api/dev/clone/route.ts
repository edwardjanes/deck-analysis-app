import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Dev-only endpoint: clones an existing submission (reuses its PDF) so you
// can re-run the full analysis flow without re-uploading.
export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();

  if (!sourceId) {
    return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
  }

  // Fetch the source submission
  const { data: source, error: fetchError } = await supabaseAdmin
    .from("deck_submissions")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (fetchError || !source) {
    return NextResponse.json({ error: "Source submission not found" }, { status: 404 });
  }

  if (!source.deck_file_path) {
    return NextResponse.json({ error: "Source has no deck file" }, { status: 400 });
  }

  // Copy the PDF to a new path so it has its own storage object
  const newId = crypto.randomUUID();
  const fileName = source.deck_file_path.split("/").pop()!;
  const newFilePath = `${newId}/${fileName}`;

  const { error: copyError } = await supabaseAdmin.storage
    .from("decks")
    .copy(source.deck_file_path, newFilePath);

  if (copyError) {
    return NextResponse.json({ error: `Storage copy failed: ${copyError.message}` }, { status: 500 });
  }

  // Create a fresh submission record
  const { data: newSubmission, error: insertError } = await supabaseAdmin
    .from("deck_submissions")
    .insert({
      id:             newId,
      first_name:     source.first_name,
      last_name:      source.last_name,
      email:          source.email,
      business_name:  source.business_name,
      website:        source.website,
      country:        source.country,
      deck_file_path: newFilePath,
      status:         "pending",
    })
    .select("id")
    .single();

  if (insertError || !newSubmission) {
    // Clean up copied file
    await supabaseAdmin.storage.from("decks").remove([newFilePath]);
    return NextResponse.json({ error: `DB insert failed: ${insertError?.message}` }, { status: 500 });
  }

  return NextResponse.json({ id: newSubmission.id });
}
