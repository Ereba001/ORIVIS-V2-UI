import type { UUID } from './common';

export interface ElectionResult {
  electionId: UUID;
  totalVotes: number;
  totalEligible: number;
  turnout: number;
  candidates: CandidateResult[];
  status: 'PRELIMINARY' | 'FINAL' | 'CERTIFIED';
}

export interface CandidateResult {
  candidateId: UUID;
  name: string;
  party?: string;
  voteCount: number;
  percentage: number;
}
