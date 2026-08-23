import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface TrackingPayload {
  listing_id: string;
  event_type: string;
  visitor_session_id?: string;
  referrer?: string;
  user_agent?: string;
}

/**
 * Hash an IP address for privacy (one-way, consistent)
 */
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Extract client IP from request (handle various proxy headers)
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || request.ip || '0.0.0.0';
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackingPayload = await req.json();

    // Validate required fields
    if (!body.listing_id || !body.event_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      'view',
      'click_website',
      'click_deck',
      'click_data_room',
      'click_contact',
      'intro_request',
    ];
    if (!validEventTypes.includes(body.event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Get hashed IP
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // Insert engagement event
    const { error: insertError } = await supabaseAdmin
      .from('listing_engagement_events')
      .insert({
        listing_id: body.listing_id,
        event_type: body.event_type,
        visitor_session_id: body.visitor_session_id || null,
        referrer: body.referrer || null,
        user_agent: body.user_agent || null,
        ip_hash: ipHash,
        occurred_at: new Date().toISOString(),
      });

    if (insertError) {
      Sentry.captureException(insertError, {
        tags: { context: 'listing_engagement_insert' },
        extra: { listing_id: body.listing_id, event_type: body.event_type },
      });
      console.error('[track] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to record event' },
        { status: 500 }
      );
    }

    // Increment view count if this is a view event
    if (body.event_type === 'view') {
      const { error: rpcError } = await supabaseAdmin
        .rpc('increment_listing_view_count', {
          listing_id_input: body.listing_id,
        });

      if (rpcError) {
        Sentry.captureException(rpcError, {
          tags: { context: 'listing_view_count_increment' },
          extra: { listing_id: body.listing_id },
        });
        console.error('[track] View count RPC error:', rpcError);
        // Non-fatal: event was logged, just the counter failed
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'listing_track_endpoint' },
    });
    console.error('[track] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
