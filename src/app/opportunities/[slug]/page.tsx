import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RaiseListing } from '@/lib/raiseListing/types';
import ListingDetailView from '@/components/raise-listing/ListingDetailView';
import ListingViewTracker from '@/components/raise-listing/ListingViewTracker';

interface ListingDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { data: listing } = await supabaseAdmin
    .from('raise_listings')
    .select('company_name, one_liner')
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .maybeSingle();

  if (!listing) return { title: 'Listing Not Found' };

  return {
    title: `${listing.company_name} | Investment Opportunities | Source Capital`,
    description: listing.one_liner || `View ${listing.company_name}'s capital raise on Source Capital`,
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  // Fetch listing with team members
  const { data: listing, error } = await supabaseAdmin
    .from('raise_listings')
    .select(`
      *,
      raise_listing_team_members(*)
    `)
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .maybeSingle();

  if (error || !listing) {
    console.error('[listing detail] DB error:', error);
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
      <ListingDetailView listing={listingWithTeam} />
      <ListingViewTracker listingId={listingWithTeam.id} />
    </main>
  );
}
