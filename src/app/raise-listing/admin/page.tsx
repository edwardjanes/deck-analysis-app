import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminReviewQueueClient from '@/components/raise-listing/AdminReviewQueueClient';

export const metadata = {
  title: 'Listing Review Queue | Source Capital Admin',
};

export default async function AdminQueuePage() {
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
    redirect('/login?next=/raise-listing/admin');
  }

  // Check sc_admin status
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('sc_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.sc_admin) {
    redirect('/');
  }

  // Fetch pending listings
  const { data: listings, error } = await supabaseAdmin
    .from('raise_listings')
    .select('*')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('[admin queue] DB error:', error);
    throw new Error('Failed to load review queue');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff' }}>
      {/* Header */}
      <header style={{ background: '#0A0A0A', borderBottom: '1px solid #1F2937', padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '0' }}>
            Listing Review Queue
          </h1>
        </div>
      </header>

      <AdminReviewQueueClient listings={listings || []} />
    </main>
  );
}
