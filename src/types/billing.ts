export type EventBillingStatus =
  | 'pending'
  | 'payment_required'
  | 'payment_pending'
  | 'paid'
  | 'free_granted'
  | 'cancelled'
  | 'failed'

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'cancelled'

export interface EventBilling {
  id: number
  uuid: string
  election_id: number
  organization_id: number
  status: EventBillingStatus
  amount: number
  paid_amount: number
  currency: string
  paid_at: string | null
  payment_reference: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface BillingQuote {
  tier: {
    id: number
    name: string
    code: string
    min_participants: number
    max_participants: number
    price: number
    currency: string
    is_free: boolean
  } | null
  participant_count: number
  amount: number
  currency: string
  is_free: boolean
  /** Price of the same capacity without the free entitlement — the "normal"
   * plan price shown crossed out when is_free is true. */
  regular_amount: number
  regular_tier_name: string | null
}

export interface EventBillingSnapshot {
  billing: EventBilling
  quote: BillingQuote
  freeEntitlement: {
    available: boolean
  }
  /** Authoritative server-side verdict: the event is cleared to publish/schedule
   * (nothing is owed, or it is paid/free granted). ₦0 events are always true. */
  billingSatisfied: boolean
}

export interface EventPayment {
  id: number
  uuid: string
  event_billing_id: number
  election_id: number
  organization_id: number
  provider: string
  reference: string
  provider_reference: string | null
  status: PaymentStatus
  amount: number
  currency: string
  provider_payload: Record<string, unknown> | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentInitialized {
  payment: EventPayment
  authorizationUrl: string | null
  accessCode: string | null
}

export interface BillingPaymentRow {
  id: number
  uuid: string
  election_id: number
  organization_id: number
  provider: string
  reference: string
  status: PaymentStatus
  amount: number
  currency: string
  verified_at: string | null
  paid_at: string | null
  created_at: string
  election?: { id: number; uuid: string; title: string } | null
  event_billing?: { id: number; uuid: string } | null
}
