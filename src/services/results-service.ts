import { getApiClient, unwrapPayload, readOrNull } from '../lib/api-client';
import { API } from '../constants/api';

export interface ResultsElectionSummary {
  id: string;
  title: string;
  slug: string;
  type: string;
  category: string;
  status: string;
  lifecycleState: string;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  resultsPublishAt: string | null;
}

export interface ResultsSummary {
  eligibleVoters: number;
  registeredVoters: number;
  ballotsCast: number;
  confirmedVotes: number;
  turnout: number;
}

export interface ResultsCandidate {
  id: string;
  name: string;
  photoUrl: string | null;
  status: string;
  ballotOrder: number;
  voteCount: number;
  voteShare: number;
  rank: number;
  elected: boolean;
  winner: boolean;
}

export interface ResultsPosition {
  id: string;
  title: string;
  description: string;
  maxSelections: number;
  ballotOrder: number;
  totalVotes: number;
  candidates: ResultsCandidate[];
}

export interface ElectionResults {
  election: ResultsElectionSummary;
  live: boolean;
  isLive: boolean;
  resultsPublished: boolean;
  summary: ResultsSummary;
  positions: ResultsPosition[];
}

export const resultsService = {
  async getResults(electionId: string): Promise<ElectionResults> {
    const { data } = await getApiClient().get<unknown>(`/elections/${electionId}/results`);
    return unwrapPayload<ElectionResults>(data);
  },

  async getLiveResults(electionId: string): Promise<ElectionResults> {
    const { data } = await getApiClient().get<unknown>(`/elections/${electionId}/results/live`);
    return unwrapPayload<ElectionResults>(data);
  },

  async getPublicResults(slug: string): Promise<ElectionResults | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(`/public/elections/${slug}/results`);
      return unwrapPayload<ElectionResults>(data);
    });
  },

  async getPublicLiveResults(slug: string, passCode: string): Promise<ElectionResults> {
    const { data } = await getApiClient().get<unknown>(
      API.ENDPOINTS.PUBLIC.ELECTIONS.LIVE_RESULTS(slug),
      { headers: { 'X-Pass-Code': passCode } },
    );
    return unwrapPayload<ElectionResults>(data);
  },
};

export interface PublicElectionListItem {
  id: string;
  uuid: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  category: string | null;
  visibility: string;
  status: string;
  lifecycleState: string;
  startsAt: string | null;
  endsAt: string | null;
  totalRegistered: number;
  organizationId: string;
  organizationName: string | null;
  createdAt: string;
}
