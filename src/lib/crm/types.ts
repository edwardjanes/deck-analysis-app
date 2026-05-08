export type PipelineStage =
  | 'researching'
  | 'targeted'
  | 'reached_out'
  | 'replied'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'follow_up'
  | 'due_diligence'
  | 'term_sheet'
  | 'committed'
  | 'passed';

export type TouchpointType =
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'meeting'
  | 'note'
  | 'follow_up_scheduled'
  | 'intro_requested'
  | 'intro_made'
  | 'linkedin_message'
  | 'document_shared'
  | 'other';

export interface InvestorProfile {
  id: string;
  fund_name: string;
  contact_name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  website: string | null;
  stage_focus: string[];
  geography: string[];
  sector_focus: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  thesis_notes: string | null;
  verified: boolean;
  created_at: string;
}

export interface PipelineInvestor {
  id: string;
  user_id: string;
  investor_profile_id: string | null;
  fund_name: string;
  contact_name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  stage_focus: string[];
  geography: string[];
  sector_focus: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  thesis_notes: string | null;
  stage: PipelineStage;
  personal_notes: string | null;
  next_follow_up_date: string | null;
  follow_up_note: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  touchpoints?: Touchpoint[];
}

export interface Touchpoint {
  id: string;
  pipeline_investor_id: string;
  user_id: string;
  type: TouchpointType;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  created_at: string;
  external_message_id: string | null;
  thread_id: string | null;
  email_opened: boolean | null;
  email_replied: boolean | null;
}
