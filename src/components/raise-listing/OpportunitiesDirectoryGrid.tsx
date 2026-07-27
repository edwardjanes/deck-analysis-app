'use client';

import { useState, useMemo } from 'react';
import { RaiseListing, RAISE_LISTING_STAGE_LABELS } from '@/lib/raiseListing/types';
import ListingCard from './ListingCard';

const STAGE_OPTIONS = [
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c_plus',
  'bridge',
  'other',
] as const;

interface OpportunitiesDirectoryGridProps {
  listings: RaiseListing[];
}

export default function OpportunitiesDirectoryGrid({ listings }: OpportunitiesDirectoryGridProps) {
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) {
      newStages.delete(stage);
    } else {
      newStages.add(stage);
    }
    setSelectedStages(newStages);
  };

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      // Stage filter
      if (selectedStages.size > 0 && !selectedStages.has(listing.stage || 'other')) {
        return false;
      }
      // Search filter (company name or one-liner)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = listing.company_name.toLowerCase().includes(term);
        const matchesOneliner = listing.one_liner?.toLowerCase().includes(term);
        if (!matchesName && !matchesOneliner) {
          return false;
        }
      }
      return true;
    });
  }, [listings, selectedStages, searchTerm]);

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Search by company name or sector..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        {/* Stage Filters */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase' }}>
            Funding Stage
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STAGE_OPTIONS.map(stage => (
              <button
                key={stage}
                onClick={() => toggleStage(stage)}
                style={{
                  padding: '8px 16px',
                  background: selectedStages.has(stage) ? '#03FB83' : '#1F2937',
                  border: '1px solid ' + (selectedStages.has(stage) ? '#03FB83' : '#374151'),
                  borderRadius: '6px',
                  color: selectedStages.has(stage) ? '#000' : '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!selectedStages.has(stage)) {
                    e.currentTarget.style.background = '#2A2A2A';
                  }
                }}
                onMouseLeave={e => {
                  if (!selectedStages.has(stage)) {
                    e.currentTarget.style.background = '#1F2937';
                  }
                }}
              >
                {RAISE_LISTING_STAGE_LABELS[stage as keyof typeof RAISE_LISTING_STAGE_LABELS]}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: '24px', color: '#9CA3AF', fontSize: '14px' }}>
          {filteredListings.length === 0
            ? 'No listings found'
            : `${filteredListings.length} ${filteredListings.length === 1 ? 'listing' : 'listings'} available`}
        </div>

        {/* Grid */}
        {filteredListings.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: '#6B7280',
            }}
          >
            <p style={{ fontSize: '16px' }}>No listings match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
