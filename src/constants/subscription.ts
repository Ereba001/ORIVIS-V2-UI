export type SubscriptionTierId = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'

export interface SubscriptionTier {
  id: SubscriptionTierId
  name: string
  maxVoters: number
  price: string
  priceNote?: string
  features: string[]
  recommended?: boolean
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    maxVoters: 1000,
    price: 'Free',
    priceNote: 'for your first election only',
    features: [
      'Up to 1,000 voters',
      '1 election per subscription',
      'Basic support',
      'Standard branding',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    maxVoters: 10_000,
    price: 'Paid',
    priceNote: 'per election',
    features: [
      'Up to 10,000 voters',
      '1 election per subscription',
      'Priority support',
      'Custom branding',
      'Ballot tracking',
    ],
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    maxVoters: 1_000_000,
    price: 'Paid',
    priceNote: 'per election',
    features: [
      'Up to 1,000,000 voters',
      '1 election per subscription',
      'Dedicated support',
      'White label branding',
      'API access',
      'Audit logs',
      'Multi admin management',
    ],
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    maxVoters: Infinity,
    price: 'Contact Orivis',
    priceNote: 'tailored per election',
    features: [
      'Unlimited voters',
      '1 election per subscription',
      'Dedicated account manager',
      'Custom SLA',
      'On premise option',
      'Enterprise grade security',
    ],
  },
]

export function getTierForPopulation(population: number): SubscriptionTier {
  if (population <= 1_000) return SUBSCRIPTION_TIERS[0]
  if (population <= 10_000) return SUBSCRIPTION_TIERS[1]
  if (population <= 1_000_000) return SUBSCRIPTION_TIERS[2]
  return SUBSCRIPTION_TIERS[3]
}

export function isFirstElectionFree(tierId: SubscriptionTierId): boolean {
  return tierId === 'STARTER'
}
