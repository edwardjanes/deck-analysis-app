import { PipelineStage, TouchpointType } from "./types";

export const STAGE_ORDER: PipelineStage[] = [
  'researching',
  'targeted',
  'reached_out',
  'replied',
  'meeting_scheduled',
  'meeting_completed',
  'follow_up',
  'due_diligence',
  'term_sheet',
  'committed',
  'passed',
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  researching:        'Researching',
  targeted:           'Targeted',
  reached_out:        'Reached Out',
  replied:            'Replied',
  meeting_scheduled:  'Meeting Scheduled',
  meeting_completed:  'Meeting Completed',
  follow_up:          'Follow-up',
  due_diligence:      'Due Diligence',
  term_sheet:         'Term Sheet',
  committed:          'Committed',
  passed:             'Passed',
};

export const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; border: string }> = {
  researching:        { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
  targeted:           { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
  reached_out:        { bg: 'rgba(139,92,246,0.15)',  text: '#A78BFA', border: 'rgba(139,92,246,0.3)' },
  replied:            { bg: 'rgba(249,115,22,0.15)',  text: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  meeting_scheduled:  { bg: 'rgba(234,179,8,0.15)',   text: '#FACC15', border: 'rgba(234,179,8,0.3)' },
  meeting_completed:  { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80', border: 'rgba(34,197,94,0.3)' },
  follow_up:          { bg: 'rgba(249,115,22,0.15)',  text: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  due_diligence:      { bg: 'rgba(6,182,212,0.15)',   text: '#22D3EE', border: 'rgba(6,182,212,0.3)' },
  term_sheet:         { bg: 'rgba(3,251,131,0.15)',   text: '#03fb83', border: 'rgba(3,251,131,0.3)' },
  committed:          { bg: 'rgba(3,251,131,0.2)',    text: '#03fb83', border: 'rgba(3,251,131,0.5)' },
  passed:             { bg: 'rgba(239,68,68,0.15)',   text: '#F87171', border: 'rgba(239,68,68,0.3)' },
};

export const TOUCHPOINT_LABELS: Record<TouchpointType, string> = {
  email_sent:          'Email Sent',
  email_received:      'Email Received',
  call:                'Call',
  meeting:             'Meeting',
  note:                'Note',
  follow_up_scheduled: 'Follow-up Scheduled',
  intro_requested:     'Intro Requested',
  intro_made:          'Intro Made',
  linkedin_message:    'LinkedIn Message',
  document_shared:     'Document Shared',
  other:               'Other',
};
