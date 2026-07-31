import type { UUID, ISO8601DateTime } from './common';

export type ElectionStatus = 'DRAFT' | 'READY' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';
export type ElectionType = 'APPROVAL' | 'ELECTION' | 'CONSULTATION' | 'REFERENDUM' | 'SURVEY';

export interface Election {
  id: UUID;
  organizationId: UUID;
  organizationName?: string;
  title: string;
  description?: string;
  type: ElectionType;
  status: ElectionStatus;
  startsAt: ISO8601DateTime;
  endsAt: ISO8601DateTime;
  registrationStartsAt?: ISO8601DateTime;
  registrationEndsAt?: ISO8601DateTime;
  timezone?: string;
  maxVotes?: number;
  allowAbstention: boolean;
  isAnonymous: boolean;
  totalRegistered?: number;
  participantCount?: number;
  candidateCount?: number;
  positionCount?: number;
  registrationProgress?: number;
  voterTurnout?: number;
  visibility?: 'public' | 'private';
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
