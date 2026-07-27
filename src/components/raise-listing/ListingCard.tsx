import Link from 'next/link';
import { RaiseListing, RAISE_LISTING_STAGE_LABELS } from '@/lib/raiseListing/types';

interface ListingCardProps {
  listing: RaiseListing;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export default function ListingCard({ listing }: ListingCardProps) {
  if (!listing.slug) return null; // Don't render if no slug (shouldn't happen for approved listings)

  const currencySymbol = CURRENCY_SYMBOLS[listing.currency] || listing.currency;
  const formatAmount = (amount: number | null) => {
    if (!amount) return '—';
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toString();
  };

  return (
    <Link href={`/opportunities/${listing.slug}`}>
      <div
        style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = '#1A1A1A';
          el.style.borderColor = '#404040';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = '#111111';
          el.style.borderColor = '#2A2A2A';
        }}
      >
        {/* Logo & Featured Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          {listing.company_logo_path ? (
            <img
              src={listing.company_logo_path}
              alt={listing.company_name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: '#1F2937',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: '#1F2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {listing.company_name.substring(0, 2).toUpperCase()}
            </div>
          )}
          {listing.featured && (
            <div
              style={{
                background: '#03FB83',
                color: '#000',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Featured
            </div>
          )}
        </div>

        {/* Company Name */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px', lineHeight: '1.3' }}>
          {listing.company_name}
        </h3>

        {/* One-liner */}
        {listing.one_liner && (
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px', lineHeight: '1.4', flex: 1 }}>
            {listing.one_liner}
          </p>
        )}

        {/* Stage & Amount */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {listing.stage && (
            <span
              style={{
                background: '#1F2937',
                color: '#E5E7EB',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {RAISE_LISTING_STAGE_LABELS[listing.stage]}
            </span>
          )}
          {listing.target_raise_amount && (
            <span
              style={{
                background: '#1F2937',
                color: '#E5E7EB',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {currencySymbol}
              {formatAmount(listing.target_raise_amount)}
            </span>
          )}
        </div>

        {/* Sectors */}
        {listing.sector && listing.sector.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {listing.sector.slice(0, 3).map((sector, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(3, 251, 131, 0.1)',
                  color: '#03FB83',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                {sector}
              </span>
            ))}
            {listing.sector.length > 3 && (
              <span
                style={{
                  color: '#6B7280',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                +{listing.sector.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Count */}
        <div
          style={{
            paddingTop: '12px',
            borderTop: '1px solid #1F2937',
            color: '#6B7280',
            fontSize: '12px',
          }}
        >
          <span>👁️ {listing.view_count} {listing.view_count === 1 ? 'view' : 'views'}</span>
        </div>
      </div>
    </Link>
  );
}
