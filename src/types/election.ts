import type { UUID, ISO8601DateTime } from './common';

export type ElectionStatus = 'DRAFT' | 'CREATED' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'ARCHIVED' | 'CANCELLED';
export type ElectionType = 'APPROVAL' | 'ELECTION' | 'CONSULTATION' | 'REFERENDUM' | 'SURVEY';
export type LifecycleState = 'draft' | 'published' | 'live' | 'open' | 'ended' | 'closed' | 'archived' | 'cancelled';

export interface ElectionBranding {
  organizationName?: string;
  workspaceName?: string;
  shortName?: string;
  workspaceTitle?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  themeMode?: string;
}

export interface Election {
  id: UUID;
  slug?: string;
  organizationId: UUID;
  organizationName?: string;
  title: string;
  description?: string;
  type: ElectionType;
  status: ElectionStatus;
  startsAt: ISO8601DateTime;
  endsAt: ISO8601DateTime;
  startedAt?: ISO8601DateTime;
  endedAt?: ISO8601DateTime;
  scheduledPublishAt?: string | null;
  registrationStartsAt?: ISO8601DateTime;
  registrationEndsAt?: ISO8601DateTime;
  timezone?: string;
  maxVotes?: number;
  allowAbstention: boolean;
  isAnonymous: boolean;
  isMultiParty?: boolean;
  candidateSlots?: number;
  customCategory?: string;
  category?: string;
  totalRegistered?: number;
  participantCount?: number;
  candidateCount?: number;
  positionCount?: number;
  registeredCount?: number;
  passesIssued?: number;
  votedCount?: number;
  registrationProgress?: number;
  voterTurnout?: number;
  maxVoters?: number | null;
  visibility?: 'public' | 'private';
  lifecycleState?: LifecycleState;
  bannerUrl?: string | null;
  subtitle?: string | null;
  branding?: ElectionBranding;
  settings?: {
    is_anonymous?: boolean | string;
    allow_abstention?: boolean | string;
    allow_multiple_votes?: boolean | string;
    require_email_verification?: boolean | string;
    require_id_verification?: boolean | string;
    require_two_factor?: boolean | string;
    result_publication?: string;
    live_results?: boolean | string;
    notify_on_registration?: boolean | string;
    notify_on_vote?: boolean | string;
    max_votes?: number | string;
    theme?: string;
    logo_url?: string | null;
    custom_url?: string | null;
  };
  positions?: PublicPosition[];
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface CreateElectionInput {
  title: string;
  description?: string;
  type: ElectionType;
  startsAt: ISO8601DateTime;
  endsAt: ISO8601DateTime;
  maxVotes?: number;
  allowAbstention?: boolean;
  isAnonymous?: boolean;
}

export interface UpdateElectionInput {
  title?: string;
  description?: string;
  status?: ElectionStatus;
  startsAt?: ISO8601DateTime;
  endsAt?: ISO8601DateTime;
  candidateSlots?: number;
  isMultiParty?: boolean;
  customCategory?: string;
  auditNote: string;
}

export interface StartStopElectionInput {
  auditNote: string;
}

export interface ElectionPosition {
  id: UUID;
  electionId: UUID;
  title: string;
  description: string;
  maxSelections: number;
  ballotOrder: number;
}

export interface ElectionCandidate {
  id: UUID;
  electionId: UUID;
  positionId: UUID;
  name: string;
  party?: string;
  bio?: string;
  photoUrl?: string;
  manifestoUrl?: string;
  ballotOrder: number;
  voteCount?: number;
}

export interface PublicPosition {
  id: UUID;
  title: string;
  description?: string;
  maxSelections: number;
  ballotOrder?: number;
  candidates: PublicCandidate[];
}

export interface PublicCandidate {
  id: UUID;
  name: string;
  photoUrl?: string;
  campaignImageUrl?: string;
  party?: string;
  partyLogoUrl?: string;
  slogan?: string;
  bio?: string;
  biography?: string;
  manifesto?: string;
  manifestoUrl?: string;
  candidateCode?: string;
  sortOrder?: number;
}

export interface VoterElectionView {
  id: UUID;
  title: string;
  organizationName: string;
  description?: string;
  status: ElectionStatus;
  startsAt: ISO8601DateTime;
  endsAt: ISO8601DateTime;
  totalRegistered: number;
  positions: VoterPositionView[];
}

export interface VoterPositionView {
  id: UUID;
  title: string;
  description: string;
  maxSelections: number;
  candidates: VoterCandidateView[];
}

export interface VoterCandidateView {
  id: UUID;
  name: string;
  party?: string;
  bio?: string;
  photoUrl?: string;
  votes?: number;
}

export interface ElectionAuditLog {
  id: number;
  event: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  user: { id: number; name: string; email: string } | null;
}
