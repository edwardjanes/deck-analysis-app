'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RaiseListing } from '@/lib/raiseListing/types';

interface AdminListingReviewClientProps {
  listing: RaiseListing;
  adminId: string;
}

export default function AdminListingReviewClient({
  listing,
  adminId,
}: AdminListingReviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/raise-listing/admin/listings/${listing.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_id: adminId }),
        }
      );

      if (response.ok) {
        router.push('/raise-listing/admin');
        router.refresh();
      } else {
        const err = await response.json();
        alert(`Approval failed: ${err.error}`);
      }
    } catch (error) {
      console.error('[approve] Error:', error);
      alert('Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/raise-listing/admin/listings/${listing.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: adminId,
            rejection_reason: rejectionReason,
          }),
        }
      );

      if (response.ok) {
        router.push('/raise-listing/admin');
        router.refresh();
      } else {
        const err = await response.json();
        alert(`Rejection failed: ${err.error}`);
      }
    } catch (error) {
      console.error('[reject] Error:', error);
      alert('Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header with back link */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/raise-listing/admin">
          <button
            style={{
              background: 'transparent',
              color: '#03FB83',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0',
              marginBottom: '16px',
            }}
          >
            ← Back to Queue
          </button>
        </Link>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
          {listing.company_name}
        </h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '0' }}>
          Submitted {new Date(listing.submitted_at || listing.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Main content + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Listing content */}
        <div>
          {listing.company_logo_path && (
            <img
              src={listing.company_logo_path}
              alt={listing.company_name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            />
          )}

          {listing.one_liner && (
            <p style={{ fontSize: '16px', color: '#D1D5DB', marginBottom: '24px' }}>
              {listing.one_liner}
            </p>
          )}

          {listing.description && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                Pitch
              </h2>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.description}
              </div>
            </section>
          )}

          {listing.traction_summary && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                Traction
              </h2>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  padding: '16px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.traction_summary}
              </div>
            </section>
          )}

          {listing.use_of_funds && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                Use of Funds
              </h2>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  padding: '16px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.use_of_funds}
              </div>
            </section>
          )}

          {listing.team_members && listing.team_members.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                Team
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {listing.team_members.map((member, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    {member.photo_path && (
                      <img
                        src={member.photo_path}
                        alt={member.name}
                        style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                      {member.name}
                    </p>
                    {member.role && (
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '0' }}>
                        {member.role}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Admin actions sidebar */}
        <div style={{ height: 'fit-content', position: 'sticky', top: '24px' }}>
          <div
            style={{
              background: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
              Admin Actions
            </h3>

            {/* Details */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2A2A2A' }}>
              <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                Stage
              </p>
              <p style={{ fontSize: '13px', color: '#E5E7EB', marginBottom: '12px' }}>
                {listing.stage || '—'}
              </p>

              <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                Raise Amount
              </p>
              <p style={{ fontSize: '13px', color: '#E5E7EB', marginBottom: '0' }}>
                {listing.target_raise_amount
                  ? `${listing.currency} ${listing.target_raise_amount}`
                  : '—'}
              </p>
            </div>

            {/* Approve button */}
            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                width: '100%',
                background: '#03FB83',
                color: '#000',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: '12px',
              }}
            >
              {loading ? 'Processing...' : 'Approve Listing'}
            </button>

            {/* Reject section */}
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#EF4444',
                  border: '1px solid #DC2626',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Reject Listing
              </button>
            ) : (
              <div>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0A0A0A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: '#1F2937',
                      color: '#fff',
                      border: '1px solid #374151',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
