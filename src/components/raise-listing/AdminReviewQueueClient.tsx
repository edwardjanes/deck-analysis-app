'use client';

import Link from 'next/link';
import { RaiseListing } from '@/lib/raiseListing/types';

interface AdminReviewQueueClientProps {
  listings: RaiseListing[];
}

export default function AdminReviewQueueClient({ listings }: AdminReviewQueueClientProps) {
  if (listings.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF', fontSize: '16px' }}>No listings pending review</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 200px 100px',
              gap: '16px',
              padding: '16px',
              background: '#0A0A0A',
              borderBottom: '1px solid #1F2937',
              fontWeight: 600,
              fontSize: '12px',
              color: '#9CA3AF',
              textTransform: 'uppercase',
            }}
          >
            <div>Company</div>
            <div>Submitted</div>
            <div>Stage</div>
            <div>Action</div>
          </div>

          {/* Table rows */}
          {listings.map(listing => (
            <div
              key={listing.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 200px 100px',
                gap: '16px',
                padding: '16px',
                borderBottom: '1px solid #1F2937',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  {listing.company_name}
                </p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '0' }}>
                  {listing.one_liner}
                </p>
              </div>

              <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
                {new Date(listing.submitted_at || listing.created_at).toLocaleDateString()}
              </div>

              <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                {listing.stage || '—'}
              </div>

              <Link href={`/raise-listing/admin/${listing.id}`}>
                <button
                  style={{
                    background: '#03FB83',
                    color: '#000',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Review
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
