import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RaiseListing } from '@/lib/raiseListing/types';
import OpportunitiesDirectoryGrid from '@/components/raise-listing/OpportunitiesDirectoryGrid';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Investment Opportunities | Source Capital',
  description: 'Discover vetted pre-seed and seed startups raising capital.',
};

export default async function OpportunitiesPage() {
  // Fetch all approved listings ordered by featured status and publish date
  const { data: listings, error } = await supabaseAdmin
    .from('raise_listings')
    .select(`
      *,
      raise_listing_team_members(*)
    `)
    .eq('status', 'approved')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[opportunities] DB error:', error);
    notFound();
  }

  const typedListings = (listings || []) as unknown as (RaiseListing & {
    raise_listing_team_members: any[];
  })[];

  // Attach team members
  const listingsWithTeam = typedListings.map(listing => ({
    ...listing,
    team_members: listing.raise_listing_team_members || [],
  }));

  return (
    <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff' }}>
      {/* Header */}
      <header style={{ background: '#0A0A0A', borderBottom: '1px solid #1F2937', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '12px' }}>
            Investment Opportunities
          </h1>
          <p style={{ fontSize: '18px', color: '#9CA3AF', marginBottom: '0' }}>
            Discover vetted startups raising capital at pre-seed and seed stage
          </p>
        </div>
      </header>

      {/* Directory Grid */}
      <OpportunitiesDirectoryGrid listings={listingsWithTeam} />
    </main>
  );
}
