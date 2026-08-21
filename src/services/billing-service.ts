import { getApiClient, unwrapPayload } from '../lib/api-client';
import { API } from '../constants/api';
import type {
  BillingPaymentRow,
  BillingQuote,
  EventBillingSnapshot,
  PaymentInitialized,
} from '../types/billing';

export interface BillingEventRecord {
  uuid: string
  election_id: number
  election_title: string
  status: string
  participant_count: number
  amount: number
  paid_amount: number
  currency: string
  tier_name: string | null
  is_free: boolean
  created_at: string
}

export interface BillingOverview {
  summary: {
    total_billed: number
    total_paid: number
    pending_amount: number
    total_events: number
    paid_events: number
    free_events: number
    pending_events: number
    currency: string
  }
  events: BillingEventRecord[]
}

export const billingService = {
  async getQuote(participants: number, currency = 'NGN'): Promise<{
    quote: BillingQuote;
    freeEntitlement: { available: boolean };
  }> {
    const qs = new URLSearchParams({ participants: String(Math.max(0, Math.floor(participants))), currency });
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.BILLING_QUOTE}?${qs.toString()}`);
    return unwrapPayload<{ quote: BillingQuote; freeEntitlement: { available: boolean } }>(res.data);
  },

  async getCapacityStatus(electionId: string, projected?: number): Promise<{
    capacity: {
      ceiling: number | null;
      current_participants: number;
      remaining_capacity: number | null;
      projected_participants: number | null;
      exceeds: boolean;
      currency: string;
      current_tier?: Record<string, unknown> | null;
      required_tier?: Record<string, unknown> | null;
      new_amount?: number | null;
      additional_amount?: number | null;
      upgrade_possible?: boolean;
    };
  }> {
    const qs = new URLSearchParams();
    if (projected !== undefined) qs.set('projected', String(projected));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.EVENT_BILLING_CAPACITY(electionId)}${suffix}`);
    return unwrapPayload<{ capacity: Record<string, unknown> }>(res.data) as { capacity: { ceiling: number | null; current_participants: number; remaining_capacity: number | null; projected_participants: number | null; exceeds: boolean; currency: string; current_tier?: Record<string, unknown> | null; required_tier?: Record<string, unknown> | null; new_amount?: number | null; additional_amount?: number | null; upgrade_possible?: boolean } };
  },

  async recordCapacityConsent(electionId: string, payload: {
    decision: 'upgrade_and_continue' | 'keep_current_tier';
    capacity?: number;
    projected_participants?: number;
    trimmed_to?: number;
    reason?: string;
  }): Promise<void> {
    const res = await getApiClient().post<unknown>(API.ENDPOINTS.ORG.EVENT_BILLING_CAPACITY_CONSENT(electionId), payload);
    unwrapPayload(res.data);
  },

  async upgradeCapacity(electionId: string, capacity: number, reason?: string): Promise<{
    billing: Record<string, unknown>;
    capacity: Record<string, unknown>;
  }> {
    const res = await getApiClient().post<unknown>(API.ENDPOINTS.ORG.EVENT_BILLING_UPGRADE(electionId), { capacity, reason });
    return unwrapPayload<{ billing: Record<string, unknown>; capacity: Record<string, unknown> }>(res.data);
  },

  async getEventBilling(electionId: string): Promise<EventBillingSnapshot> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.EVENT_BILLING(electionId));
    return unwrapPayload<EventBillingSnapshot>(res.data);
  },

  async initializePayment(electionId: string, callbackUrl?: string): Promise<PaymentInitialized> {
    const res = await getApiClient().post<unknown>(
      API.ENDPOINTS.ORG.EVENT_BILLING_PAY(electionId),
      callbackUrl ? { callback_url: callbackUrl } : {},
    );
    return unwrapPayload<PaymentInitialized>(res.data);
  },

  async verifyPayment(paymentId: string): Promise<unknown> {
    const res = await getApiClient().post<unknown>(API.ENDPOINTS.ORG.PAYMENT_VERIFY(paymentId));
    return unwrapPayload<unknown>(res.data);
  },

  async getOverview(): Promise<BillingOverview> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.BILLING_OVERVIEW);
    return unwrapPayload<BillingOverview>(res.data);
  },

  async getPayments(params?: { status?: string; per_page?: number }): Promise<{
    items: BillingPaymentRow[];
    meta: { current_page: number; per_page: number; total: number; last_page: number } | null;
  }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.PAYMENTS}${suffix}`) as {
      data: BillingPaymentRow[];
      meta?: { current_page: number; per_page: number; total: number; last_page: number };
    };
    return { items: res.data, meta: res.meta ?? null };
  },
};