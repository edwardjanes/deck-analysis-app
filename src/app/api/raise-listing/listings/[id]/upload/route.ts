import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/raise-listing/listings/[id]/upload
 * Upload logo or pitch deck file
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const cookieHeader = req.headers.get('cookie') || '';
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            return cookieHeader.split('; ').map(c => {
              const [name, value] = c.split('=');
              return { name, value };
            });
          },
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the listing to verify ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('raise_listings')
      .select('user_id')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const field = (formData.get('field') as string) || 'company_logo_path';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file based on field
    let bucket: string;
    let maxSize: number;
    let mimeTypes: string[];

    if (field === 'company_logo_path') {
      bucket = 'raise-listing-logos';
      maxSize = 5 * 1024 * 1024; // 5MB
      mimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    } else if (field === 'pitch_deck_file_path') {
      bucket = 'raise-listing-decks';
      maxSize = 20 * 1024 * 1024; // 20MB
      mimeTypes = ['application/pdf'];
    } else {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large (max ${maxSize / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    if (!mimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate file path
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${params.id}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      Sentry.captureException(uploadError, {
        tags: { context: 'file_upload' },
        extra: { listing_id: params.id, field },
      });
      console.error('[upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    // Get public URL (for logos) or signed URL (for decks)
    let fileUrl: string;
    if (field === 'company_logo_path') {
      const { data: signedData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName);
      fileUrl = signedData.publicUrl;
    } else {
      const { data: signedData } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 day expiry
      if (!signedData) {
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
      }
      fileUrl = signedData.signedUrl;
    }

    return NextResponse.json({ success: true, file_path: fileUrl });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'file_upload_endpoint' },
    });
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
