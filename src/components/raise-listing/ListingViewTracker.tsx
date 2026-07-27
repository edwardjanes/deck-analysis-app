'use client';

import { useEffect, useRef } from 'react';

interface ListingViewTrackerProps {
  listingId: string;
}

export default function ListingViewTracker({ listingId }: ListingViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    // Track view only once per page load, and only if not already tracked
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Get or create a visitor session ID (first-party cookie)
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const setCookie = (name: string, value: string, days: number) => {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    };

    let sessionId = getCookie('rl_visitor_session');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setCookie('rl_visitor_session', sessionId, 30); // 30 day cookie
    }

    // Fire tracking request in background (non-blocking)
    fetch('/api/raise-listing/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        event_type: 'view',
        visitor_session_id: sessionId,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }),
    }).catch(err => {
      // Silently fail tracking errors — don't disrupt user experience
      console.debug('[ListingViewTracker] Tracking error:', err);
    });
  }, [listingId]);

  return null; // This component renders nothing
}
