import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateFull } from '@/lib/raiseListing/validation';

/**
 * POST /api/raise-listing/listings/[id]/submit
 * Submit a listing for review (move from draft to pending_review)
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
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate form data
    const body = await req.json();
    const validation = validateFull(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update listing to pending_review
    const { error: updateError } = await supabaseAdmin
      .from('raise_listings')
      .update({
        ...body,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { context: 'listing_submit' },
        extra: { listing_id: params.id },
      });
      console.error('[submit] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'listing_submit_endpoint' },
    });
    console.error('[submit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
