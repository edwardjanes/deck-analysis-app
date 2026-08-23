'use client';

import Link from 'next/link';
import { RaiseListing, RAISE_LISTING_STAGE_LABELS } from '@/lib/raiseListing/types';

interface ListingDetailViewProps {
  listing: RaiseListing;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export default function ListingDetailView({ listing }: ListingDetailViewProps) {
  const currencySymbol = CURRENCY_SYMBOLS[listing.currency] || listing.currency;

  const formatAmount = (amount: number | null) => {
    if (!amount) return '—';
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toString();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px', maxWidth: '100%' }}>
        {/* Main content */}
        <div>
          {/* Hero section with logo and title */}
          <div style={{ marginBottom: '40px' }}>
            {listing.company_logo_path && (
              <img
                src={listing.company_logo_path}
                alt={listing.company_name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  background: '#1F2937',
                  objectFit: 'cover',
                }}
              />
            )}
            <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '12px', lineHeight: '1.1' }}>
              {listing.company_name}
            </h1>
            {listing.one_liner && (
              <p style={{ fontSize: '18px', color: '#D1D5DB', marginBottom: '24px' }}>
                {listing.one_liner}
              </p>
            )}

            {/* Stage and key details badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {listing.stage && (
                <span
                  style={{
                    background: 'rgba(3, 251, 131, 0.1)',
                    color: '#03FB83',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {RAISE_LISTING_STAGE_LABELS[listing.stage]}
                </span>
              )}
              {listing.target_raise_amount && (
                <span
                  style={{
                    background: '#1F2937',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Raising: {currencySymbol}
                  {formatAmount(listing.target_raise_amount)}
                </span>
              )}
              {listing.minimum_check_size && (
                <span
                  style={{
                    background: '#1F2937',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Min: {currencySymbol}
                  {formatAmount(listing.minimum_check_size)}
                </span>
              )}
            </div>
          </div>

          {/* Website link */}
          {listing.company_website && (
            <div style={{ marginBottom: '40px' }}>
              <a
                href={listing.company_website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#1F2937',
                  color: '#03FB83',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid #374151',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = '#2A2A2A';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = '#1F2937';
                }}
              >
                Visit Website →
              </a>
            </div>
          )}

          {/* Description / Pitch */}
          {listing.description && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                About the Raise
              </h2>
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.description}
              </div>
            </section>
          )}

          {/* Traction */}
          {listing.traction_summary && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                Traction & Milestones
              </h2>
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  padding: '24px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.traction_summary}
              </div>
            </section>
          )}

          {/* Use of Funds */}
          {listing.use_of_funds && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                Use of Funds
              </h2>
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#D1D5DB',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  padding: '24px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {listing.use_of_funds}
              </div>
            </section>
          )}

          {/* Pitch Deck */}
          {listing.pitch_deck_file_path && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                Pitch Deck
              </h2>
              <a
                href={listing.pitch_deck_file_path}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#03FB83',
                  color: '#000',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00E070';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#03FB83';
                }}
              >
                Download Deck
              </a>
            </section>
          )}

          {/* Team */}
          {listing.team_members && listing.team_members.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
                Team
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '24px',
                }}
              >
                {listing.team_members.map((member, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    {member.photo_path && (
                      <img
                        src={member.photo_path}
                        alt={member.name}
                        style={{
                          width: '100%',
                          maxWidth: '140px',
                          height: '140px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          background: '#1F2937',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                      {member.name}
                    </h3>
                    {member.role && (
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
                        {member.role}
                      </p>
                    )}
                    {member.bio && (
                      <p style={{ fontSize: '12px', color: '#D1D5DB', lineHeight: '1.4' }}>
                        {member.bio}
                      </p>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          color: '#03FB83',
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        LinkedIn →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar CTA */}
        <div style={{ height: 'fit-content', position: 'sticky', top: '24px' }}>
          <div
            style={{
              background: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Interested in this opportunity?
            </h3>

            {/* Engagement info (Phase 1: static teaser) */}
            <div
              style={{
                background: 'rgba(3, 251, 131, 0.1)',
                border: '1px solid rgba(3, 251, 131, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#03FB83',
              }}
            >
              <p style={{ margin: '0', fontWeight: 600 }}>
                👁️ {listing.view_count} people have viewed this listing
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#D1D5DB' }}>
                Upgrade to see investor names and get real-time notifications
              </p>
            </div>

            {/* CTA Buttons */}
            <Link href="/raise-listing/create?next=/opportunities">
              <button
                style={{
                  width: '100%',
                  background: '#03FB83',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00E070';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#03FB83';
                }}
              >
                Create Your Listing
              </button>
            </Link>

            <button
              style={{
                width: '100%',
                background: 'transparent',
                color: '#03FB83',
                border: '1px solid #03FB83',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(3, 251, 131, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Request an Intro
            </button>

            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '16px', textAlign: 'center', margin: '16px 0 0 0' }}>
              Backed by Source Capital
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
