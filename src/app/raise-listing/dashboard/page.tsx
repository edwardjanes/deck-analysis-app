import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RaiseListing } from '@/lib/raiseListing/types';
import FounderDashboardClient from '@/components/raise-listing/FounderDashboardClient';

export const metadata = {
  title: 'My Listing Dashboard | Source Capital',
};

export default async function DashboardPage() {
  // Get current user
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/raise-listing/dashboard');
  }

  // Fetch user's current (non-archived) listing
  const { data: listing, error } = await supabaseAdmin
    .from('raise_listings')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[dashboard] DB error:', error);
    throw new Error('Failed to load dashboard');
  }

  const typedListing = listing as RaiseListing | null;

  return (
    <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff' }}>
      {typedListing ? (
        <FounderDashboardClient listing={typedListing} />
      ) : (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
              No Active Listing
            </h1>
            <p style={{ fontSize: '16px', color: '#9CA3AF', marginBottom: '32px' }}>
              You don't have an active raise listing yet. Create one to get started.
            </p>
            <a
              href="/raise-listing/create"
              style={{
                display: 'inline-block',
                background: '#03FB83',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create Your Listing
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
