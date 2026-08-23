import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RaiseListing } from '@/lib/raiseListing/types';
import CreateListingWizard from '@/components/raise-listing/CreateListingWizard';

interface CreateListingDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Create Your Raise Listing | Source Capital',
};

export default async function CreateListingDetailPage({ params }: CreateListingDetailPageProps) {
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
    redirect(`/login?next=/raise-listing/create/${params.id}`);
  }

  // Fetch listing — user must be the owner
  const { data: listing, error } = await supabaseAdmin
    .from('raise_listings')
    .select('*, raise_listing_team_members(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !listing) {
    console.error('[create detail] DB error:', error);
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
      <CreateListingWizard initialListing={listingWithTeam} />
    </main>
  );
}
