import { useState } from "react"
import { motion } from "motion/react"
import { ArrowLeft, ChevronRight, Vote, Users, BarChart3, Award, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import SeoHead from "../components/SeoHead"

interface Contestant {
  id: string
  name: string
  votes: number
  percentage: number
}

interface Position {
  id: string
  title: string
  contestants: Contestant[]
  totalVotes: number
}

interface Election {
  id: string
  name: string
  organization: string
  status: "Live" | "Concluded" | "Upcoming"
  positions: Position[]
  totalVoters: number
  turnout: number
  date: string
}

const MOCK_ELECTIONS: Election[] = [
  {
    id: "el-1",
    name: "Board of Directors Election 2026",
    organization: "Multilancer Ltd.",
    status: "Live",
    date: "Jul 15, 2026",
    totalVoters: 2840,
    turnout: 62,
    positions: [
      {
        id: "pos-1",
        title: "Chairperson",
        totalVotes: 1482,
        contestants: [
          { id: "c-1", name: "Dr. Amina Bello", votes: 623, percentage: 42 },
          { id: "c-2", name: "Mr. Chidi Okonkwo", votes: 487, percentage: 33 },
          { id: "c-3", name: "Mrs. Funke Adeyemi", votes: 372, percentage: 25 },
        ],
      },
      {
        id: "pos-2",
        title: "Vice Chairperson",
        totalVotes: 1421,
        contestants: [
          { id: "c-4", name: "Engr. Samuel Peters", votes: 511, percentage: 36 },
          { id: "c-5", name: "Dr. Ngozi Eze", votes: 469, percentage: 33 },
          { id: "c-6", name: "Mr. Tunde Bakare", votes: 441, percentage: 31 },
        ],
      },
      {
        id: "pos-3",
        title: "Secretary",
        totalVotes: 1450,
        contestants: [
          { id: "c-7", name: "Ms. Adaobi Okafor", votes: 725, percentage: 50 },
          { id: "c-8", name: "Mr. Olumide Johnson", votes: 435, percentage: 30 },
          { id: "c-9", name: "Mrs. Chinwe Obi", votes: 290, percentage: 20 },
        ],
      },
    ],
  },
  {
    id: "el-2",
    name: "Faculty Budget & Grants Bill",
    organization: "Rivers State University Faculty of Engineering",
    status: "Concluded",
    date: "Jul 10, 2026",
    totalVoters: 4500,
    turnout: 78,
    positions: [
      {
        id: "pos-4",
        title: "Budget Ratification",
        totalVotes: 3510,
        contestants: [
          { id: "c-10", name: "Approve Budget", votes: 2457, percentage: 70 },
          { id: "c-11", name: "Reject Budget", votes: 1053, percentage: 30 },
        ],
      },
      {
        id: "pos-5",
        title: "Research Grant Allocation",
        totalVotes: 3480,
        contestants: [
          { id: "c-12", name: "Proposal A — Engineering Labs", votes: 1392, percentage: 40 },
          { id: "c-13", name: "Proposal B — Digital Library", votes: 1044, percentage: 30 },
          { id: "c-14", name: "Proposal C — Faculty Development", votes: 1044, percentage: 30 },
        ],
      },
    ],
  },
  {
    id: "el-3",
    name: "Corporate By-Laws Ratification",
    organization: "Meranos Ltd.",
    status: "Upcoming",
    date: "Opens in 3 days",
    totalVoters: 1200,
    turnout: 0,
    positions: [
      {
        id: "pos-6",
        title: "Governance Restructure",
        totalVotes: 0,
        contestants: [
          { id: "c-15", name: "Adopt New By-Laws", votes: 0, percentage: 0 },
          { id: "c-16", name: "Maintain Current By-Laws", votes: 0, percentage: 0 },
        ],
      },
    ],
  },
  {
    id: "el-4",
    name: "Global Tech Advisory Referendum",
    organization: "Global Tech Innovators Inc.",
    status: "Concluded",
    date: "Jul 5, 2026",
    totalVoters: 8900,
    turnout: 85,
    positions: [
      {
        id: "pos-7",
        title: "Open-Source Standard Adoption",
        totalVotes: 7565,
        contestants: [
          { id: "c-17", name: "Adopt Standard", votes: 5296, percentage: 70 },
          { id: "c-18", name: "Maintain Proprietary", votes: 2269, percentage: 30 },
        ],
      },
      {
        id: "pos-8",
        title: "AI Ethics Policy",
        totalVotes: 7500,
        contestants: [
          { id: "c-19", name: "Framework A — Strict Oversight", votes: 3750, percentage: 50 },
          { id: "c-20", name: "Framework B — Industry Self-Regulation", votes: 2250, percentage: 30 },
          { id: "c-21", name: "Framework C — Hybrid Approach", votes: 1500, percentage: 20 },
        ],
      },
    ],
  },
]

type ViewState = "list" | "positions" | "contestants"

export default function Results() {
  const [view, setView] = useState<ViewState>("list")
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  const openElection = (el: Election) => {
    setSelectedElection(el)
    setView("positions")
  }

  const openPosition = (pos: Position) => {
    setSelectedPosition(pos)
    setView("contestants")
  }

  const backToList = () => {
    setView("list")
    setSelectedElection(null)
    setSelectedPosition(null)
  }

  const backToPositions = () => {
    setView("positions")
    setSelectedPosition(null)
  }

  const maxVotes = (contestants: Contestant[]) =>
    Math.max(...contestants.map((c) => c.votes), 1)

  return (
    <>
      <SeoHead meta={{ title: "Results Centre | ORIVIS" }} />
      <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans antialiased">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {view === "list" && (
          <motion.div
            key="results-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Public Verifiable Data</span>
              <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight text-brand-text-primary">
                Election Results
              </h1>
              <p className="text-xs text-brand-text-muted max-w-xl mt-1">
                Browse published results from past and active elections. Select an election to view position-level breakdowns and individual contestant vote counts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_ELECTIONS.map((el) => {
                const hasResults = el.status !== "Upcoming"
                return (
                <button
                  key={el.id}
                  onClick={() => hasResults && openElection(el)}
                  className={`glass-card rounded-[20px] p-5 text-left transition-all ${
                    hasResults ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      el.status === "Live"
                        ? "bg-brand-surface-elevated text-brand-text-primary border border-brand-border"
                        : el.status === "Concluded"
                        ? "bg-status-success/10 text-status-success"
                        : "bg-brand-bg-secondary text-brand-text-muted border border-brand-border"
                    }`}>
                      {el.status === "Live" && <span className="w-1 h-1 rounded-full bg-status-error animate-pulse" />}
                      {el.status}
                    </span>
                    <span className="text-[9px] font-mono text-brand-text-muted">{el.date}</span>
                  </div>
                  <h3 className="font-sans font-extrabold text-xs uppercase tracking-tight text-brand-text-primary mb-0.5">{el.name}</h3>
                  <p className="text-[10px] text-brand-text-muted mb-4">{el.organization}</p>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-brand-text-muted border-t border-brand-border pt-3">
                    <span className="flex items-center gap-1"><Users size={11} />{el.totalVoters.toLocaleString()} voters</span>
                    <span className="flex items-center gap-1"><BarChart3 size={11} />{el.turnout}% turnout</span>
                    <span className="flex items-center gap-1 ml-auto"><ChevronRight size={12} className="text-brand-gold" /></span>
                  </div>
                </button>
              )
            })}
            </div>
          </motion.div>
        )}

        {view === "positions" && selectedElection && (
          <motion.div
            key="results-positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button onClick={backToList}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer mb-2">
              <ArrowLeft size={13} /> Back to Elections
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">{selectedElection.organization}</span>
              <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-brand-text-primary">{selectedElection.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-brand-text-muted">
                <span className="flex items-center gap-1"><Users size={12} />{selectedElection.totalVoters.toLocaleString()} registered</span>
                <span className="flex items-center gap-1"><TrendingUp size={12} />{selectedElection.turnout}% turnout</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                  selectedElection.status === "Concluded" ? "text-status-success" : "text-status-error"
                }`}>
                  {selectedElection.status === "Live" ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                  {selectedElection.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedElection.positions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => openPosition(pos)}
                  className="glass-card rounded-[20px] p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans font-extrabold text-xs uppercase tracking-tight text-brand-text-primary">{pos.title}</h3>
                    <Award size={15} className="text-brand-gold" />
                  </div>
                  <div className="space-y-2">
                    {pos.contestants.sort((a, b) => b.votes - a.votes).slice(0, 3).map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            i === 0 ? "bg-brand-gold" : i === 1 ? "bg-brand-text-muted" : "bg-brand-text-disabled"
                          }`} />
                          <span className={i === 0 ? "font-bold text-brand-text-primary" : "text-brand-text-muted"}>{c.name}</span>
                        </span>
                        <span className="font-mono font-bold">{c.votes} votes</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-border flex items-center justify-between text-[9px] font-mono text-brand-text-muted">
                    <span>{pos.totalVotes} total votes</span>
                    <ChevronRight size={12} className="text-brand-gold" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {view === "contestants" && selectedPosition && selectedElection && (
          <motion.div
            key="results-contestants"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button onClick={backToPositions}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer mb-2">
              <ArrowLeft size={13} /> Back to Positions
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">{selectedElection.organization}</span>
              <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-brand-text-primary">{selectedPosition.title}</h1>
              <p className="text-xs text-brand-text-muted mt-1">
                {selectedElection.name} &mdash; {selectedPosition.totalVotes} ballots cast
              </p>
            </div>

            <div className="space-y-3">
              {selectedPosition.contestants
                .sort((a, b) => b.votes - a.votes)
                .map((c, i) => {
                  const barWidth = c.votes > 0 ? (c.votes / maxVotes(selectedPosition.contestants)) * 100 : 0
                  const isWinner = i === 0 && c.votes > 0
                  return (
                    <div key={c.id} className="glass-card rounded-[20px] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isWinner && <Award size={14} className="text-brand-gold" />}
                          <h3 className={`font-sans font-extrabold text-xs uppercase tracking-tight ${isWinner ? "text-brand-gold" : "text-brand-text-primary"}`}>
                            {c.name}
                          </h3>
                          {isWinner && <span className="text-[8px] font-mono font-bold uppercase text-status-success bg-status-success/10 px-1.5 py-0.5 rounded">Leading</span>}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-brand-text-primary">{c.votes.toLocaleString()}</span>
                          <span className="text-[9px] font-mono text-brand-text-muted ml-1">votes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2.5 bg-brand-bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${isWinner ? "bg-brand-gold" : "bg-brand-text-muted/40"}`}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-brand-text-primary min-w-[3rem] text-right">{c.percentage}%</span>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="glass-card rounded-[20px] p-5 flex items-center justify-between text-[10px] font-mono text-brand-text-muted">
              <span className="flex items-center gap-2"><Vote size={14} /> Total valid ballots for this position</span>
              <span className="font-bold text-brand-text-primary">{selectedPosition.totalVotes.toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}
