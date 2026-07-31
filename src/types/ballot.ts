import type { UUID, ISO8601DateTime } from './common';

export interface Ballot {
  id: UUID;
  electionId: UUID;
  voterId: UUID;
  selections: BallotSelection[];
  submittedAt: ISO8601DateTime;
  receiptToken?: string;
  isSpoiled: boolean;
}

export interface BallotSelection {
  candidateId: UUID;
  preference?: number;
}

export interface CastBallotInput {
  electionId: UUID;
  selections: BallotSelection[];
}
