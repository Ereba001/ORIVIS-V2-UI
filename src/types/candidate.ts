import type { UUID, ISO8601DateTime } from './common';

export interface Candidate {
  id: UUID;
  electionId: UUID;
  userId: UUID;
  name: string;
  bio?: string;
  photoUrl?: string;
  party?: string;
  manifestoUrl?: string;
  ballotOrder: number;
  createdAt: ISO8601DateTime;
}

export interface CreateCandidateInput {
  electionId: UUID;
  userId: UUID;
  name: string;
  bio?: string;
  photoUrl?: string;
  party?: string;
  manifestoUrl?: string;
  ballotOrder?: number;
}
