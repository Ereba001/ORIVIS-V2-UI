export type CampaignType = 'GOVERNANCE_ELECTION' | 'AWARDS' | 'PAID_VOTING' | 'SURVEY' | 'POLL'

export const CAMPAIGN_TYPES: { id: CampaignType; label: string; description: string; comingSoon: boolean }[] = [
  {
    id: 'GOVERNANCE_ELECTION',
    label: 'Governance Election',
    description: 'Secure, verifiable elections for leadership positions, board members, and organizational decisions.',
    comingSoon: false,
  },
  {
    id: 'AWARDS',
    label: 'Awards',
    description: 'Transparent voting for awards ceremonies, recognitions, and competitive selections.',
    comingSoon: true,
  },
  {
    id: 'PAID_VOTING',
    label: 'Paid Voting',
    description: 'Monetize your elections with paid access, ticketing, and premium voting features.',
    comingSoon: true,
  },
  {
    id: 'SURVEY',
    label: 'Surveys',
    description: 'Collect structured feedback from your community with customizable survey forms.',
    comingSoon: true,
  },
  {
    id: 'POLL',
    label: 'Polls',
    description: 'Quick, informal polling for instant feedback and sentiment gathering.',
    comingSoon: true,
  },
]

export interface CampaignData {
  type: CampaignType
  name: string
  description: string
  category: string
  estimatedVoters: string
  registrationOpens: string
  registrationCloses: string
  votingDate: string
  votingStartTime: string
  votingEndTime: string
  timezone: string
  selectedTierId: string
  paid: boolean
  createdAt: string
}
