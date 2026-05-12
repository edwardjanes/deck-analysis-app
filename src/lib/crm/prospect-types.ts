export type ProspectStage =
  | 'connection_request'
  | 'engaged'
  | 'call_booked'
  | 'call_completed'
  | 'follow_up'
  | 'sale'
  | 'lost';

export const PROSPECT_STAGE_ORDER: ProspectStage[] = [
  'connection_request',
  'engaged',
  'call_booked',
  'call_completed',
  'follow_up',
  'sale',
  'lost',
];

export const PROSPECT_STAGE_LABELS: Record<ProspectStage, string> = {
  connection_request: 'Connection Request',
  engaged:            'Engaged',
  call_booked:        'Call Booked',
  call_completed:     'Call Completed',
  follow_up:          'Follow Up',
  sale:               'Sale',
  lost:               'Lost',
};

export const PROSPECT_STAGE_COLORS: Record<ProspectStage, { bg: string; text: string; border: string }> = {
  connection_request: { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8',  border: 'rgba(100,116,139,0.3)' },
  engaged:            { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA',  border: 'rgba(59,130,246,0.3)'  },
  call_booked:        { bg: 'rgba(168,85,247,0.15)',  text: '#C084FC',  border: 'rgba(168,85,247,0.3)'  },
  call_completed:     { bg: 'rgba(234,179,8,0.15)',   text: '#FCD34D',  border: 'rgba(234,179,8,0.3)'   },
  follow_up:          { bg: 'rgba(249,115,22,0.15)',  text: '#FB923C',  border: 'rgba(249,115,22,0.3)'  },
  sale:               { bg: 'rgba(3,251,131,0.15)',   text: '#03fb83',  border: 'rgba(3,251,131,0.3)'   },
  lost:               { bg: 'rgba(239,68,68,0.12)',   text: '#F87171',  border: 'rgba(239,68,68,0.25)'  },
};

export type TouchpointType =
  | 'linkedin_connection'
  | 'linkedin_message_sent'
  | 'linkedin_message_received'
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'note'
  | 'follow_up';

export const TOUCHPOINT_TYPE_LABELS: Record<TouchpointType, string> = {
  linkedin_connection:      'LinkedIn Connection',
  linkedin_message_sent:    'LinkedIn Message Sent',
  linkedin_message_received:'LinkedIn Message Received',
  email_sent:               'Email Sent',
  email_received:           'Email Received',
  call:                     'Call',
  note:                     'Note',
  follow_up:                'Follow Up',
};

export const TOUCHPOINT_ICONS: Record<TouchpointType, string> = {
  linkedin_connection:      '🔗',
  linkedin_message_sent:    '📤',
  linkedin_message_received:'📥',
  email_sent:               '✉️',
  email_received:           '📨',
  call:                     '📞',
  note:                     '📝',
  follow_up:                '🔔',
};

export interface ScProspect {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  company_name: string | null;
  role: string | null;
  location: string | null;
  stage: ProspectStage;
  lead_score: number | null;
  lead_score_rationale: string | null;
  lead_score_updated_at: string | null;
  next_follow_up_date: string | null;
  follow_up_note: string | null;
  source: string;
  hubspot_id: string | null;
  notes: string | null;
  archived: boolean;
  // joined
  touchpoints?: ScTouchpoint[];
}

export interface ScTouchpoint {
  id: string;
  created_at: string;
  prospect_id: string;
  type: TouchpointType;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  fathom_recording_url: string | null;
  fathom_transcript: string | null;
  call_duration_mins: number | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  email_opened: boolean | null;
  email_replied: boolean | null;
  ai_follow_up_suggestion: string | null;
  ai_suggested_at: string | null;
}