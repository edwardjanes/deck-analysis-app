import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/raise-listing/admin/listings/[id]/reject
 * Reject a listing (move back to draft or rejected status)
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

    // Check sc_admin status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('sc_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.sc_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the listing
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('raise_listings')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'pending_review')
      .maybeSingle();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const rejectionReason = body.rejection_reason as string;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Update listing to rejected
    const { error: updateError } = await supabaseAdmin
      .from('raise_listings')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { context: 'listing_reject' },
        extra: { listing_id: params.id },
      });
      console.error('[reject] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject listing' },
        { status: 500 }
      );
    }

    console.log(`[reject] Listing ${params.id} rejected`);
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'listing_reject_endpoint' },
    });
    console.error('[reject] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
