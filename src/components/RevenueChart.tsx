import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface RevenueMonth {
  month: string
  shortMonth: string
  revenue: number
  subscriptions: number
  newOrgs: number
  renewals: number
}

const REVENUE_DATA: RevenueMonth[] = [
  { month: 'January', shortMonth: 'Jan', revenue: 12400, subscriptions: 45, newOrgs: 8, renewals: 36 },
  { month: 'February', shortMonth: 'Feb', revenue: 13800, subscriptions: 48, newOrgs: 10, renewals: 38 },
  { month: 'March', shortMonth: 'Mar', revenue: 15200, subscriptions: 52, newOrgs: 12, renewals: 40 },
  { month: 'April', shortMonth: 'Apr', revenue: 14100, subscriptions: 50, newOrgs: 9, renewals: 41 },
  { month: 'May', shortMonth: 'May', revenue: 16500, subscriptions: 55, newOrgs: 14, renewals: 42 },
  { month: 'June', shortMonth: 'Jun', revenue: 17800, subscriptions: 58, newOrgs: 11, renewals: 45 },
  { month: 'July', shortMonth: 'Jul', revenue: 19200, subscriptions: 62, newOrgs: 15, renewals: 48 },
  { month: 'August', shortMonth: 'Aug', revenue: 18500, subscriptions: 60, newOrgs: 13, renewals: 47 },
  { month: 'September', shortMonth: 'Sep', revenue: 20100, subscriptions: 65, newOrgs: 16, renewals: 50 },
  { month: 'October', shortMonth: 'Oct', revenue: 21500, subscriptions: 68, newOrgs: 18, renewals: 52 },
  { month: 'November', shortMonth: 'Nov', revenue: 22800, subscriptions: 72, newOrgs: 20, renewals: 55 },
  { month: 'December', shortMonth: 'Dec', revenue: 24200, subscriptions: 75, newOrgs: 22, renewals: 58 },
]

type Period = "3M" | "6M" | "12M" | "YTD"

const PERIODS: Period[] = ["3M", "6M", "12M", "YTD"]

function formatCurrency(n: number) {
  return "$" + n.toLocaleString()
}

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>("12M")
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const data = [...REVENUE_DATA]
    const now = new Date()
    const currentMonth = now.getMonth()

    switch (period) {
      case "3M":
        return data.slice(Math.max(0, data.length - 3))
      case "6M":
        return data.slice(Math.max(0, data.length - 6))
      case "YTD":
        return data.slice(0, Math.min(currentMonth + 1, data.length))
      default:
        return data
    }
  }, [period])

  const selectedDetail = useMemo(() => {
    if (!selectedMonth) return null
    return REVENUE_DATA.find((d) => d.month === selectedMonth) || null
  }, [selectedMonth])

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, d) => sum + d.revenue, 0),
    [filtered],
  )

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Revenue Overview</h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setSelectedMonth(null) }}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                period === p
                  ? "bg-brand-gold text-brand-bg font-bold"
                  : "text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {selectedDetail ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 p-4 bg-brand-surface-elevated rounded-xl border border-brand-border"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-brand-text-primary">{selectedDetail.month} Details</p>
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-[9px] font-mono text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
            >
              Back to overview
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Revenue</p>
              <p className="text-lg font-bold font-mono text-brand-gold mt-1">{formatCurrency(selectedDetail.revenue)}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Subscriptions</p>
              <p className="text-lg font-bold font-mono text-brand-text-primary mt-1">{selectedDetail.subscriptions}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">New Orgs</p>
              <p className="text-lg font-bold font-mono text-status-success mt-1">+{selectedDetail.newOrgs}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Renewals</p>
              <p className="text-lg font-bold font-mono text-blue-400 mt-1">+{selectedDetail.renewals}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="mb-4 p-4 bg-brand-surface-elevated rounded-xl border border-brand-border">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-brand-gold">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] font-mono text-brand-text-muted">total ({period})</p>
          </div>
          <p className="text-[9px] font-mono text-brand-text-muted mt-1">Click any bar for monthly breakdown</p>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filtered} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="shortMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9C9CB0", fontSize: 10, fontFamily: "JetBrains Mono" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9C9CB0", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "k"}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(20, 20, 20, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
              labelStyle={{ color: "#FFFFFF", fontWeight: 600 }}
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
            />
            <Bar
              dataKey="revenue"
              fill="#FCA311"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data: unknown) => {
                const d = data as { month?: string }
                if (d?.month) setSelectedMonth(d.month)
              }}
              activeBar={{ fill: "#FFB938" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
