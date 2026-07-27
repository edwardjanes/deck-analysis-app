import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RaiseListing } from '@/lib/raiseListing/types';
import AdminListingReviewClient from '@/components/raise-listing/AdminListingReviewClient';

interface AdminReviewPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Review Listing | Source Capital Admin',
};

export default async function AdminReviewPage({ params }: AdminReviewPageProps) {
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
    redirect(`/login?next=/raise-listing/admin/${params.id}`);
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

  // Fetch listing (must be pending_review)
  const { data: listing, error } = await supabaseAdmin
    .from('raise_listings')
    .select('*, raise_listing_team_members(*)')
    .eq('id', params.id)
    .eq('status', 'pending_review')
    .maybeSingle();

  if (error || !listing) {
    console.error('[admin review] DB error:', error);
    notFound();
  }

  const typedListing = listing as unknown as RaiseListing & {
    raise_listing_team_members: any[];
  };

  const listingWithTeam: RaiseListing = {
    ...typedListing,
    team_members: typedListing.raise_listing_team_members || [],
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff' }}>
      <AdminListingReviewClient listing={listingWithTeam} adminId={user.id} />
    </main>
  );
}
