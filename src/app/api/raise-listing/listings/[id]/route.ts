import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * PATCH /api/raise-listing/listings/[id]
 * Autosave draft listing data
 */
export async function PATCH(
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

    // Update listing
    const body = await req.json();
    const { error: updateError } = await supabaseAdmin
      .from('raise_listings')
      .update(body)
      .eq('id', params.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { context: 'listing_patch' },
        extra: { listing_id: params.id },
      });
      console.error('[PATCH listing] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'listing_patch_endpoint' },
    });
    console.error('[PATCH listing] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
