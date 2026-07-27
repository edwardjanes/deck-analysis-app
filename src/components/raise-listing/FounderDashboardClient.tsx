'use client';

import Link from 'next/link';
import { RaiseListing, RAISE_LISTING_STATUS_LABELS } from '@/lib/raiseListing/types';
import GatedInfoCard from './GatedInfoCard';

interface FounderDashboardClientProps {
  listing: RaiseListing;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: '#1F2937', text: '#9CA3AF', border: '#374151' },
  pending_review: { bg: 'rgba(251, 146, 60, 0.1)', text: '#FB923C', border: '#EA580C' },
  approved: { bg: 'rgba(3, 251, 131, 0.1)', text: '#03FB83', border: '#03FB83' },
  rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#DC2626' },
  archived: { bg: '#1F2937', text: '#6B7280', border: '#374151' },
};

export default function FounderDashboardClient({ listing }: FounderDashboardClientProps) {
  const statusColor = STATUS_COLORS[listing.status] || STATUS_COLORS.draft;
  const isApproved = listing.status === 'approved';
  const isDraft = listing.status === 'draft';
  const isPending = listing.status === 'pending_review';

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            {listing.company_name}
          </h1>
          <p style={{ fontSize: '16px', color: '#9CA3AF' }}>
            {listing.one_liner || 'Your capital raise'}
          </p>
        </div>

        {/* Status Card */}
        <div
          style={{
            background: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>
                Status
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: statusColor.text, marginBottom: '8px' }}>
                {RAISE_LISTING_STATUS_LABELS[listing.status]}
              </p>
              {listing.status === 'rejected' && listing.rejection_reason && (
                <p style={{ fontSize: '13px', color: '#F87171' }}>
                  Reason: {listing.rejection_reason}
                </p>
              )}
              {listing.status === 'pending_review' && (
                <p style={{ fontSize: '13px', color: '#FB923C' }}>
                  Our team is reviewing your listing. You'll receive an update soon.
                </p>
              )}
              {listing.status === 'approved' && (
                <p style={{ fontSize: '13px', color: '#03FB83' }}>
                  Your listing is live in the Opportunities directory
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {isDraft && (
                <Link href={`/raise-listing/create/${listing.id}`}>
                  <button
                    style={{
                      background: '#03FB83',
                      color: '#000',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Continue Editing
                  </button>
                </Link>
              )}

              {isPending && (
                <button
                  disabled
                  style={{
                    background: '#374151',
                    color: '#9CA3AF',
                    border: '1px solid #1F2937',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                  }}
                >
                  Pending Review
                </button>
              )}

              {isApproved && (
                <>
                  <Link href={`/opportunities/${listing.slug}`}>
                    <button
                      style={{
                        background: '#1F2937',
                        color: '#fff',
                        border: '1px solid #374151',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      View Public Listing
                    </button>
                  </Link>
                  <Link href={`/raise-listing/create/${listing.id}`}>
                    <button
                      style={{
                        background: '#1F2937',
                        color: '#fff',
                        border: '1px solid #374151',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit Listing
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Engagement Stats (Phase 1: static view count) */}
        {isApproved && (
          <div
            style={{
              background: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Engagement
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Views</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
                  {listing.view_count}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Unique Viewers</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
                  {listing.unique_viewer_count}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gated Info Card (Phase 1 teaser for Phase 2 feature) */}
        {isApproved && (
          <div style={{ marginBottom: '32px' }}>
            <GatedInfoCard
              tier={listing.tier}
              viewCount={listing.view_count}
              uniqueViewerCount={listing.unique_viewer_count}
              listingId={listing.id}
            />
          </div>
        )}

        {/* Quick Info */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            Listing Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Funding Stage</p>
              <p style={{ fontSize: '14px', color: '#E5E7EB' }}>
                {listing.stage || '—'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Target Raise</p>
              <p style={{ fontSize: '14px', color: '#E5E7EB' }}>
                {listing.target_raise_amount ? `${listing.currency} ${listing.target_raise_amount}` : '—'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Created</p>
              <p style={{ fontSize: '14px', color: '#E5E7EB' }}>
                {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>
            {listing.published_at && (
              <div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Published</p>
                <p style={{ fontSize: '14px', color: '#E5E7EB' }}>
                  {new Date(listing.published_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
