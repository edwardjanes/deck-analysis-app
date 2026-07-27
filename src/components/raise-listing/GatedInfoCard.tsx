'use client';

import { RaiseListingTier } from '@/lib/raiseListing/types';

interface GatedInfoCardProps {
  tier: RaiseListingTier;
  viewCount: number;
  uniqueViewerCount: number;
  listingId: string;
}

export default function GatedInfoCard({
  tier,
  viewCount,
  uniqueViewerCount,
  listingId,
}: GatedInfoCardProps) {
  const isGated = tier === 'free';

  if (!isGated) {
    // Phase 2+: show real investor names
    return (
      <div
        style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          Investor Interest
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
          You're on the {tier} tier. Real investor names and engagement details will appear here in Phase 2.
        </p>
      </div>
    );
  }

  // Phase 1: Teaser/conversion prompt for free tier
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(3, 251, 131, 0.05) 0%, rgba(3, 251, 131, 0.02) 100%)',
        border: '1px solid rgba(3, 251, 131, 0.2)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#03FB83' }}>
        🔒 See Who's Interested
      </h2>

      <p style={{ fontSize: '14px', color: '#D1D5DB', marginBottom: '16px', lineHeight: '1.5' }}>
        <strong>{viewCount} investors</strong> have viewed your listing. Upgrade to Growth or Priority to see who they are,
        get notified in real-time, and unlock advanced analytics.
      </p>

      <div
        style={{
          background: 'rgba(3, 251, 131, 0.1)',
          border: '1px solid rgba(3, 251, 131, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#A7F3D0',
        }}
      >
        Phase 1 Preview: Investor names will unlock in Phase 2 when investor-side authentication is added.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={() => {
            // Phase 2: link to upgrade page
            window.location.href = `/raise-listing/upgrade?tier=growth&listing_id=${listingId}`;
          }}
          style={{
            background: '#03FB83',
            color: '#000',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Upgrade to Growth
        </button>
        <button
          onClick={() => {
            window.location.href = `/raise-listing/upgrade?tier=priority&listing_id=${listingId}`;
          }}
          style={{
            background: '#1F2937',
            color: '#03FB83',
            border: '1px solid #03FB83',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Upgrade to Priority
        </button>
      </div>

      <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '12px', marginBottom: '0' }}>
        Growth tier: $99/month | Priority tier: $299/month (or one-time for this raise)
      </p>
    </div>
  );
}
