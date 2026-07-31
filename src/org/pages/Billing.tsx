import { useState } from 'react'
import { motion } from 'motion/react'
import {
  CreditCard, CheckCircle2, Zap, Building2, ArrowRight, Crown, Download,
  AlertCircle, Clock, Receipt, TrendingUp, Users, HardDrive,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import WidgetPanel from '../components/WidgetPanel'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import { BILLING_PLANS, INVOICES, PAYMENT_METHODS, SUBSCRIPTION, STORAGE } from '../mock/data'
import SeoHead from "../../components/SeoHead"

export default function OrgBilling() {
  const { branding } = useOrgBranding()
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const pColor = branding.primaryColor

  const currentPlan = BILLING_PLANS.find((p) => p.id === 'plan-enterprise')!

  const filteredPlans = BILLING_PLANS

  const recentInvoices = INVOICES.slice(0, 5)

  return (
    <>
    <SeoHead meta={{ title: "Billing — Organization | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--org-primary)' }}>Billing & Subscription</h1>
        <p className="text-sm text-brand-text-muted mt-1">Manage your subscription, view invoices, and compare packages.</p>
      </div>

      <DashboardCard hover={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${pColor}15` }}>
              <Crown size={24} style={{ color: pColor }} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-text-primary">
                Current Plan: <span style={{ color: pColor }}>{SUBSCRIPTION.plan}</span>
              </p>
              <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                Next billing: {SUBSCRIPTION.nextBilling} · ${(SUBSCRIPTION.amount / 100).toLocaleString()}/{SUBSCRIPTION.currency}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-full bg-status-success/10 text-status-success uppercase tracking-wider font-bold">
              <CheckCircle2 size={10} /> Active
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-brand-divider">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={12} className="text-brand-text-muted" />
              <span className="text-lg font-bold font-mono" style={{ color: pColor }}>{SUBSCRIPTION.seatsUsed}</span>
              <span className="text-[10px] font-mono text-brand-text-muted">/ {SUBSCRIPTION.seatsTotal}</span>
            </div>
            <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Team Seats</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={12} className="text-brand-text-muted" />
              <span className="text-lg font-bold font-mono" style={{ color: pColor }}>12,450</span>
              <span className="text-[10px] font-mono text-brand-text-muted">voters</span>
            </div>
            <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Participants Used</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <HardDrive size={12} className="text-brand-text-muted" />
              <span className="text-lg font-bold font-mono" style={{ color: pColor }}>{STORAGE.used}</span>
              <span className="text-[10px] font-mono text-brand-text-muted">/ {STORAGE.total} {STORAGE.unit}</span>
            </div>
            <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Storage</p>
          </div>
        </div>
      </DashboardCard>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Compare Packages</h2>
        <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-lg p-0.5">
          <button onClick={() => setInterval('month')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
              interval === 'month' ? 'text-white' : 'text-brand-text-muted'
            }`}
            style={interval === 'month' ? { backgroundColor: pColor } : {}}>Monthly</button>
          <button onClick={() => setInterval('year')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
              interval === 'year' ? 'text-white' : 'text-brand-text-muted'
            }`}
            style={interval === 'year' ? { backgroundColor: pColor } : {}}>Annual</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlans.map((plan) => {
          const isCurrent = plan.id === currentPlan.id
          const price = interval === 'year' ? plan.price * 10 : plan.price
          return (
            <motion.div key={plan.id} whileHover={{ scale: 1.02 }}
              className={`rounded-2xl p-5 border relative ${
                isCurrent
                  ? 'border-[var(--org-primary)]/50 shadow-lg'
                  : 'border-brand-divider bg-brand-surface'
              }`}
              style={isCurrent ? { backgroundColor: `${pColor}05` } : {}}>
              {isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-widest px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: pColor }}>
                  Current Plan
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {plan.popular ? <Zap size={16} style={{ color: pColor }} /> : <Building2 size={16} className="text-brand-text-muted" />}
                <h3 className="text-sm font-bold text-brand-text-primary">{plan.name}</h3>
              </div>
              <p className="text-3xl font-black font-display text-brand-text-primary mb-1">
                ${price === 0 ? '0' : (price / 100).toLocaleString()}
                <span className="text-[10px] font-mono font-normal text-brand-text-muted">
                  {price === 0 ? '' : interval === 'month' ? '/mo' : '/yr'}
                </span>
              </p>
              <p className="text-[10px] text-brand-text-muted mb-4">{plan.description}</p>
              <ul className="space-y-1.5 mb-5">
                {plan.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[10px] text-brand-text-muted">
                    <CheckCircle2 size={10} className="text-status-success mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.features.length > 6 && (
                  <li className="text-[9px] font-mono" style={{ color: pColor }}>+{plan.features.length - 6} more features</li>
                )}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isCurrent ? 'bg-brand-surface border border-brand-divider text-brand-text-muted cursor-not-allowed' : 'text-white'
                }`}
                style={isCurrent ? {} : { backgroundColor: pColor }}
                disabled={isCurrent}>
                {isCurrent ? 'Current Plan' : <><ArrowRight size={12} /> Upgrade</>}
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Payment Method</h2>
          {PAYMENT_METHODS.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between p-3 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
              <div className="flex items-center gap-3">
                <CreditCard size={16} style={{ color: pColor }} />
                <div>
                  <p className="text-xs font-semibold text-brand-text-primary">{pm.brand} ending in {pm.last4}</p>
                  <p className="text-[9px] font-mono text-brand-text-muted">Expires {pm.expMonth}/{pm.expYear}</p>
                </div>
                {pm.isDefault && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-muted">Default</span>}
              </div>
              <button className="text-[10px] font-mono font-bold" style={{ color: pColor }}>Update</button>
            </div>
          ))}
          <button className="mt-3 w-full py-2.5 rounded-xl border border-brand-divider text-[10px] font-mono text-brand-text-muted hover:bg-brand-surface-interactive transition-all">
            + Add Payment Method
          </button>
        </DashboardCard>

        <DashboardCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Recent Invoices</h2>
            <button className="flex items-center gap-1 text-[9px] font-mono font-bold" style={{ color: pColor }}>
              <Download size={10} /> Export All
            </button>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices" description="Your invoices will appear here." />
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-surface-interactive/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-surface-elevated">
                      {inv.status === 'paid' ? <CheckCircle2 size={14} className="text-status-success" /> :
                       inv.status === 'pending' ? <Clock size={14} className="text-status-warning" /> :
                       <AlertCircle size={14} className="text-status-error" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">{inv.description}</p>
                      <p className="text-[9px] font-mono text-brand-text-muted">{inv.issuedAt}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-brand-text-primary">${(inv.amount / 100).toLocaleString()}</p>
                    <span className={`text-[9px] font-mono uppercase tracking-wider ${
                      inv.status === 'paid' ? 'text-status-success' :
                      inv.status === 'pending' ? 'text-status-warning' : 'text-status-error'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
    </>
  )
}