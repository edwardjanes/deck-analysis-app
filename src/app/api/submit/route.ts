import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { classifyUploadError } from "@/lib/errorHandler";
import { createOrUpdateContact as createGHLContact } from "@/lib/ghl";
import { createOrUpdateContact as createLoopsContact } from "@/lib/loops";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let submissionId: string | undefined;

  try {
    const formData = await req.formData();

    const firstName    = (formData.get("firstName") as string)?.trim();
    const lastName     = (formData.get("lastName") as string)?.trim();
    const email        = (formData.get("email") as string)?.trim().toLowerCase();
    const businessName = (formData.get("businessName") as string)?.trim();
    const website      = (formData.get("website") as string)?.trim();
    const country      = (formData.get("country") as string)?.trim();
    const file         = formData.get("deck") as File | null;
    const userId       = (formData.get("userId") as string | null) || null;

    // Email is optional for logged-in users (userId present)
    if (!firstName || !businessName || !country || (!userId && !email)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check free submission limit (1 free submission per user/email)
    {
      let existingQuery = supabaseAdmin
        .from("deck_submissions")
        .select("id, status, score")
        .limit(1);

      if (userId) {
        existingQuery = existingQuery.eq("user_id", userId);
      } else if (email) {
        existingQuery = existingQuery.eq("email", email);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        // Check if user is on pro plan
        let isPro = false;
        if (userId) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .single();
          isPro = profile?.plan === "pro";
        }

        if (!isPro) {
          return NextResponse.json({
            error: "free_limit_reached",
            message: "You've used your 1 free deck analysis. Upgrade to Pro for unlimited analyses.",
            existingSubmissionId: existing.id,
          }, { status: 403 });
        }
      }
    }

    // Classify file errors before touching the DB
    if (!file || file.type !== "application/pdf" || file.size === 0 || file.size > 25 * 1024 * 1024) {
      const result = classifyUploadError(file);
      return NextResponse.json({ error: result.user_facing_message, action: result.action }, { status: 400 });
    }

    // 1. Create submission record
    const { data: submission, error: dbError } = await supabaseAdmin
      .from("deck_submissions")
      .insert({
        first_name:    firstName,
        last_name:     lastName,
        email:         email || null,
        business_name: businessName,
        website:       website || null,
        country,
        status:        "pending",
        ...(userId ? { user_id: userId } : {}),
      })
      .select("id")
      .single();

    if (dbError || !submission) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    submissionId = submission.id;

    // Sync contact to both GHL and Loops (non-blocking)
    if (email) {
      // Push to GHL
      createGHLContact({
        email,
        firstName,
        lastName: lastName ?? "",
        // TODO: Map custom fields once we have GHL field IDs for businessName, website, country
        // customFieldValues: [
        //   { id: "field_id_businessName", value: businessName },
        //   { id: "field_id_website", value: website },
        //   { id: "field_id_country", value: country },
        // ],
      }).catch(err => {
        console.error("[ghl] Contact error:", err);
        Sentry.captureException(err, {
          tags: { type: "ghl_contact_sync" },
          extra: { email, firstName, lastName, businessName },
        });
      });

      // Push to Loops
      if (submissionId) {
        createLoopsContact({
          email,
          firstName,
          lastName: lastName ?? "",
          userGroup: "Pitch Deck Review",
          customProperties: {
            deckSubmissionId: submissionId,
            deckBusinessName: businessName,
            deckWebsite: website,
            deckCountry: country,
          },
        }).catch(err => {
          console.error("[loops] Contact error:", err);
          Sentry.captureException(err, {
            tags: { type: "loops_contact_sync" },
            extra: { email, firstName, lastName, businessName },
          });
        });
      }
    }

    // 2. Upload PDF to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const filePath   = `${submissionId}/${file.name}`;

    const { error: storageError } = await supabaseAdmin.storage
      .from("decks")
      .upload(filePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      const result = classifyUploadError(file, storageError.message);
      Sentry.captureException(new Error(storageError.message), {
        tags: { recovery_action: result.action, submission_id: submissionId },
        extra: { business_name: businessName, file_name: file.name, file_size: file.size },
      });
      await supabaseAdmin.from("deck_submissions").delete().eq("id", submissionId);
      return NextResponse.json({ error: result.user_facing_message, action: result.action }, { status: 500 });
    }

    // 3. Update record with file path
    await supabaseAdmin
      .from("deck_submissions")
      .update({ deck_file_path: filePath })
      .eq("id", submissionId);

    // 4. Increment analyses_used for logged-in users
    if (userId) {
      await supabaseAdmin.rpc("increment_analyses_used", { user_id_input: userId });
    }

    return NextResponse.json({ id: submissionId });
  } catch (err) {
    console.error("Submit error:", err);
    if (submissionId) {
      await supabaseAdmin
        .from("deck_submissions")
        .update({ status: "error", error_message: "Upload failed" })
        .eq("id", submissionId);
    }
    return NextResponse.json({ error: "Something went wrong uploading your deck. Please try again!" }, { status: 500 });
  }
}
