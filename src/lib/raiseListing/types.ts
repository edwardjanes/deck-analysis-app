export type RaiseListingStage =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c_plus'
  | 'bridge'
  | 'other';

export const RAISE_LISTING_STAGE_LABELS: Record<RaiseListingStage, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  series_c_plus: 'Series C+',
  bridge: 'Bridge',
  other: 'Other',
};

export type RaiseListingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export const RAISE_LISTING_STATUS_LABELS: Record<RaiseListingStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

export type RaiseListingTier = 'free' | 'growth' | 'priority';

export const RAISE_LISTING_TIER_LABELS: Record<RaiseListingTier, string> = {
  free: 'Free',
  growth: 'Growth',
  priority: 'Priority',
};

export type EngagementEventType =
  | 'view'
  | 'click_website'
  | 'click_deck'
  | 'click_data_room'
  | 'click_contact'
  | 'intro_request';

export const ENGAGEMENT_EVENT_TYPE_LABELS: Record<EngagementEventType, string> = {
  view: 'View',
  click_website: 'Clicked Website',
  click_deck: 'Viewed Deck',
  click_data_room: 'Accessed Data Room',
  click_contact: 'Clicked Contact',
  intro_request: 'Requested Intro',
};

export interface RaiseListing {
  id: string;
  created_at: string;
  updated_at: string;

  user_id: string;
  deck_submission_id: string | null;

  slug: string | null;
  company_name: string;
  company_website: string | null;
  company_logo_path: string | null;
  one_liner: string | null;
  description: string | null;

  sector: string[];
  stage: RaiseListingStage | null;
  target_raise_amount: number | null;
  currency: string;
  raise_type: string | null;
  minimum_check_size: number | null;
  use_of_funds: string | null;
  traction_summary: string | null;
  pitch_deck_file_path: string | null;

  status: RaiseListingStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  published_at: string | null;

  tier: RaiseListingTier;
  tier_expires_at: string | null;
  whop_membership_id: string | null;
  whop_order_id: string | null;

  featured: boolean;
  featured_until: string | null;
  verified_badge: boolean;
  boost_active_until: string | null;

  view_count: number;
  unique_viewer_count: number;

  // joined
  team_members?: RaiseListingTeamMember[];
}

export interface RaiseListingTeamMember {
  id: string;
  created_at: string;
  listing_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  linkedin_url: string | null;
  photo_path: string | null;
  order_index: number;
}

export interface ListingEngagementEvent {
  id: string;
  listing_id: string;
  event_type: EngagementEventType;
  occurred_at: string;

  visitor_session_id: string | null;
  investor_contact_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  metadata: Record<string, unknown> | null;

  // joined
  investor_contacts?: {
    id: string;
    first_name: string;
    last_name: string | null;
    investor_firms?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// Form shapes for wizard steps
export interface RaiseListingDraft {
  // Step 1: Company & Raise Basics
  company_name: string;
  company_website?: string;
  one_liner?: string;

  // Step 2: Raise Details
  stage?: RaiseListingStage;
  target_raise_amount?: number;
  currency: string;
  raise_type?: string;
  minimum_check_size?: number;
  use_of_funds?: string;

  // Step 3: Traction
  traction_summary?: string;

  // Step 4: Media
  company_logo_path?: string;
  pitch_deck_file_path?: string;

  // Step 5: Description (full pitch)
  description?: string;
  sector: string[];
}
