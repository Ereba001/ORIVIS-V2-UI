import type { UUID, ISO8601DateTime } from './common';

export type VoterStatus = 'ELIGIBLE' | 'INVITED' | 'VERIFIED' | 'VOTED' | 'DISQUALIFIED';

export interface Voter {
  id: UUID;
  electionId: UUID;
  userId: UUID;
  status: VoterStatus;
  invitedAt?: ISO8601DateTime;
  votedAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
}

export interface AddVotersInput {
  electionId: UUID;
  userIds: UUID[];
}
