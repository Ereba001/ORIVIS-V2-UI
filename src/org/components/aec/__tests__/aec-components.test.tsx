/* @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ──────────────────────────────────────────────────────────────────────
// Mock components for files not yet created by the parallel team.
// Replace these stubs with real imports once the component files land.
// The tests define the expected interface and behaviour contract.
// ──────────────────────────────────────────────────────────────────────

interface ParticipantSearchResultProps {
  participant: {
    id: string
    name: string
    email: string
    elections: Array<{ id: string; title: string; status: string }>
  }
  onSelect: (participant: ParticipantSearchResultProps['participant']) => void
}

function ParticipantSearchResultStub({ participant, onSelect }: ParticipantSearchResultProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(participant)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(participant) }}
    >
      <span>{participant.name}</span>
      <span>{participant.email}</span>
      {participant.elections.length === 0 && <span>No elections</span>}
      {participant.elections.map((el) => (
        <span key={el.id} data-testid={`badge-${el.id}`}>
          {el.title} — {el.status}
        </span>
      ))}
    </div>
  )
}

interface ElectionContextCardProps {
  election: {
    id: string
    title: string
    lifecycleState: string
    registrationOpen: boolean
    votingOpen: boolean
  }
  allowedActions: Array<{ id: string; label: string; blocked?: boolean; blockedReason?: string }>
  onSelectElection: (electionId: string) => void
}

function ElectionContextCardStub({ election, allowedActions, onSelectElection }: ElectionContextCardProps) {
  return (
    <div>
      <h3>{election.title}</h3>
      <span data-testid="lifecycle-state">{election.lifecycleState}</span>
      <span data-testid="registration-status">
        {election.registrationOpen ? 'Registration open' : 'Registration closed'}
      </span>
      {allowedActions.map((action) => (
        <button
          key={action.id}
          disabled={action.blocked}
          title={action.blocked ? action.blockedReason : undefined}
          onClick={() => onSelectElection(election.id)}
          data-testid={`action-${action.id}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

interface ActionPanelProps {
  allowedActions: Array<{ id: string; label: string; icon: string }>
  blockedActions: Array<{ id: string; label: string; icon: string; reason: string }>
  onAction: (actionId: string) => void
}

function ActionPanelStub({ allowedActions, blockedActions, onAction }: ActionPanelProps) {
  return (
    <div>
      {allowedActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          data-testid={`btn-${action.id}`}
          aria-label={action.label}
        >
          {action.label}
        </button>
      ))}
      {blockedActions.map((action) => (
        <button
          key={action.id}
          disabled
          title={action.reason}
          data-testid={`btn-${action.id}`}
          aria-label={action.label}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

interface ParticipantHeaderProps {
  participant: { name: string; email: string; voterId?: string }
  onBack: () => void
}

function ParticipantHeaderStub({ participant, onBack }: ParticipantHeaderProps) {
  return (
    <div>
      <button onClick={onBack} aria-label="Back">Back</button>
      <h2>{participant.name}</h2>
      <span>{participant.email}</span>
      {participant.voterId && <span data-testid="voter-id">{participant.voterId}</span>}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Real component imports (only the 3 that exist today)
// ──────────────────────────────────────────────────────────────────────

import AssistedAuditModal from '../AssistedAuditModal'
import ActionSuccessModal from '../ActionSuccessModal'
import AssistedConfirmModal from '../AssistedConfirmModal'

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const auditEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  event: 'assisted.participant_opened',
  actor: 'Admin User',
  description: 'Opened participant context',
  created_at: '2026-08-21T10:30:00Z',
  ...overrides,
})

// =====================================================================
// 1. ParticipantSearchResult
// =====================================================================

describe('ParticipantSearchResult', () => {
  const participant = {
    id: 'p-1',
    name: 'Amina Bello',
    email: 'amina@example.com',
    elections: [
      { id: 'e-1', title: 'Student Union', status: 'LIVE' },
      { id: 'e-2', title: 'Board Election', status: 'PUBLISHED' },
    ],
  }

  it('renders participant name and masked email', () => {
    const onSelect = vi.fn()
    render(<ParticipantSearchResultStub participant={participant} onSelect={onSelect} />)

    expect(screen.getByText('Amina Bello')).toBeTruthy()
    expect(screen.getByText('amina@example.com')).toBeTruthy()
  })

  it('renders election badges for each associated election', () => {
    const onSelect = vi.fn()
    render(<ParticipantSearchResultStub participant={participant} onSelect={onSelect} />)

    expect(screen.getByTestId('badge-e-1')).toBeTruthy()
    expect(screen.getByTestId('badge-e-2')).toBeTruthy()
    expect(screen.getByText(/Student Union/)).toBeTruthy()
    expect(screen.getByText(/Board Election/)).toBeTruthy()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<ParticipantSearchResultStub participant={participant} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Amina Bello'))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(participant)
  })

  it('handles participant with no elections gracefully', () => {
    const onSelect = vi.fn()
    const noElections = { ...participant, elections: [] }
    render(<ParticipantSearchResultStub participant={noElections} onSelect={onSelect} />)

    expect(screen.getByText('No elections')).toBeTruthy()
    expect(screen.queryByTestId(/badge-/)).toBeNull()
  })
})

// =====================================================================
// 2. ElectionContextCard
// =====================================================================

describe('ElectionContextCard', () => {
  const election = {
    id: 'e-1',
    title: 'Student Union Polls',
    lifecycleState: 'live',
    registrationOpen: true,
    votingOpen: true,
  }

  const actions = [
    { id: 'register', label: 'Register', blocked: false },
    { id: 'issue_pass', label: 'Issue Pass', blocked: false },
    { id: 'assist_vote', label: 'Assist Vote', blocked: true, blockedReason: 'Participant not verified' },
  ]

  it('renders election title and lifecycle state', () => {
    const onSelectElection = vi.fn()
    render(
      <ElectionContextCardStub
        election={election}
        allowedActions={actions}
        onSelectElection={onSelectElection}
      />,
    )

    expect(screen.getByText('Student Union Polls')).toBeTruthy()
    expect(screen.getByTestId('lifecycle-state').textContent).toBe('live')
  })

  it('shows registration status', () => {
    const onSelectElection = vi.fn()
    render(
      <ElectionContextCardStub
        election={election}
        allowedActions={actions}
        onSelectElection={onSelectElection}
      />,
    )

    expect(screen.getByTestId('registration-status').textContent).toBe('Registration open')
  })

  it('displays allowed actions as enabled buttons', () => {
    const onSelectElection = vi.fn()
    render(
      <ElectionContextCardStub
        election={election}
        allowedActions={actions}
        onSelectElection={onSelectElection}
      />,
    )

    const registerBtn = screen.getByTestId('action-register')
    const issueBtn = screen.getByTestId('action-issue_pass')

    expect(registerBtn).not.toBeDisabled()
    expect(issueBtn).not.toBeDisabled()
  })

  it('displays blocked actions with reason', () => {
    const onSelectElection = vi.fn()
    render(
      <ElectionContextCardStub
        election={election}
        allowedActions={actions}
        onSelectElection={onSelectElection}
      />,
    )

    const assistBtn = screen.getByTestId('action-assist_vote')
    expect(assistBtn).toBeDisabled()
    expect(assistBtn.getAttribute('title')).toBe('Participant not verified')
  })

  it('calls onSelectElection when election is selected', () => {
    const onSelectElection = vi.fn()
    render(
      <ElectionContextCardStub
        election={election}
        allowedActions={actions}
        onSelectElection={onSelectElection}
      />,
    )

    fireEvent.click(screen.getByTestId('action-register'))
    expect(onSelectElection).toHaveBeenCalledWith('e-1')
  })
})

// =====================================================================
// 3. ActionPanel
// =====================================================================

describe('ActionPanel', () => {
  const allowedActions = [
    { id: 'register', label: 'Register', icon: 'UserPlus' },
    { id: 'send_otp', label: 'Send OTP', icon: 'Shield' },
  ]

  const blockedActions = [
    { id: 'assist_vote', label: 'Assist Vote', icon: 'Vote', reason: 'Not verified yet' },
  ]

  it('renders all allowed actions as enabled buttons', () => {
    const onAction = vi.fn()
    render(
      <ActionPanelStub
        allowedActions={allowedActions}
        blockedActions={blockedActions}
        onAction={onAction}
      />,
    )

    expect(screen.getByTestId('btn-register')).not.toBeDisabled()
    expect(screen.getByTestId('btn-send_otp')).not.toBeDisabled()
  })

  it('renders blocked actions as disabled with tooltip', () => {
    const onAction = vi.fn()
    render(
      <ActionPanelStub
        allowedActions={allowedActions}
        blockedActions={blockedActions}
        onAction={onAction}
      />,
    )

    const btn = screen.getByTestId('btn-assist_vote')
    expect(btn).toBeDisabled()
    expect(btn.getAttribute('title')).toBe('Not verified yet')
  })

  it('calls onAction with correct action identifier when clicked', () => {
    const onAction = vi.fn()
    render(
      <ActionPanelStub
        allowedActions={allowedActions}
        blockedActions={blockedActions}
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByTestId('btn-register'))
    expect(onAction).toHaveBeenCalledWith('register')

    fireEvent.click(screen.getByTestId('btn-send_otp'))
    expect(onAction).toHaveBeenCalledWith('send_otp')
  })

  it('uses correct icons for each action type', () => {
    const onAction = vi.fn()
    render(
      <ActionPanelStub
        allowedActions={allowedActions}
        blockedActions={blockedActions}
        onAction={onAction}
      />,
    )

    expect(screen.getByLabelText('Register')).toBeTruthy()
    expect(screen.getByLabelText('Send OTP')).toBeTruthy()
    expect(screen.getByLabelText('Assist Vote')).toBeTruthy()
  })
})

// =====================================================================
// 4. ParticipantHeader
// =====================================================================

describe('ParticipantHeader', () => {
  const participant = {
    name: 'Amina Bello',
    email: 'amina@example.com',
    voterId: 'VTR-001',
  }

  it('renders participant name prominently', () => {
    const onBack = vi.fn()
    render(<ParticipantHeaderStub participant={participant} onBack={onBack} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('Amina Bello')
  })

  it('renders masked email', () => {
    const onBack = vi.fn()
    render(<ParticipantHeaderStub participant={participant} onBack={onBack} />)

    expect(screen.getByText('amina@example.com')).toBeTruthy()
  })

  it('renders voter ID display', () => {
    const onBack = vi.fn()
    render(<ParticipantHeaderStub participant={participant} onBack={onBack} />)

    expect(screen.getByTestId('voter-id').textContent).toBe('VTR-001')
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<ParticipantHeaderStub participant={participant} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})

// =====================================================================
// 5. AssistedConfirmModal (real component)
// =====================================================================

describe('AssistedConfirmModal', () => {
  const defaultProps = {
    open: true,
    title: 'Register Participant',
    description: 'This will register the participant for the election.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
  }

  beforeEach(() => {
    defaultProps.onConfirm.mockClear()
    defaultProps.onCancel.mockClear()
  })

  it('renders title and description', () => {
    render(<AssistedConfirmModal {...defaultProps} />)

    expect(screen.getByText('Register Participant')).toBeTruthy()
    expect(screen.getByText('This will register the participant for the election.')).toBeTruthy()
  })

  it('renders custom confirm and cancel labels', () => {
    render(
      <AssistedConfirmModal
        {...defaultProps}
        confirmLabel="Register Now"
        cancelLabel="Go Back"
      />,
    )

    expect(screen.getByRole('button', { name: /register now/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /go back/i })).toBeTruthy()
  })

  it('calls onConfirm when confirm button clicked', () => {
    render(<AssistedConfirmModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button clicked', () => {
    render(<AssistedConfirmModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('does not call onCancel on Escape when loading', () => {
    render(<AssistedConfirmModal {...defaultProps} loading />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel on Escape when not loading', () => {
    render(<AssistedConfirmModal {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('shows Processing text on confirm button when loading', () => {
    render(<AssistedConfirmModal {...defaultProps} loading />)

    expect(screen.getByRole('button', { name: /processing/i })).toBeTruthy()
  })

  it('disables buttons when loading', () => {
    render(<AssistedConfirmModal {...defaultProps} loading />)

    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('does not render when open is false', () => {
    render(<AssistedConfirmModal {...defaultProps} open={false} />)

    expect(screen.queryByText('Register Participant')).toBeNull()
  })
})

// =====================================================================
// 6. ActionSuccessModal (real component)
// =====================================================================

describe('ActionSuccessModal', () => {
  vi.useFakeTimers()

  const defaultProps = {
    open: true,
    title: 'Registration Complete',
    message: 'Participant has been registered successfully.',
    onClose: vi.fn(),
  }

  beforeEach(() => {
    defaultProps.onClose.mockClear()
    vi.clearAllTimers()
  })

  it('renders title and message', () => {
    render(<ActionSuccessModal {...defaultProps} />)

    expect(screen.getByText('Registration Complete')).toBeTruthy()
    expect(screen.getByText('Participant has been registered successfully.')).toBeTruthy()
  })

  it('calls onClose when close button clicked', () => {
    render(<ActionSuccessModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('renders action button when actionLabel and onAction are provided', () => {
    const onAction = vi.fn()
    render(
      <ActionSuccessModal
        {...defaultProps}
        actionLabel="Next Step"
        onAction={onAction}
      />,
    )

    const btn = screen.getByRole('button', { name: /next step/i })
    expect(btn).toBeTruthy()

    fireEvent.click(btn)
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('does not render action button when onAction is absent', () => {
    render(<ActionSuccessModal {...defaultProps} />)

    expect(screen.queryByRole('button', { name: /next step/i })).toBeNull()
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy()
  })

  it('auto-closes after 3 seconds when no onAction is provided', () => {
    render(<ActionSuccessModal {...defaultProps} />)

    expect(defaultProps.onClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(3000)
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('does not auto-close when onAction is provided', () => {
    const onAction = vi.fn()
    render(
      <ActionSuccessModal
        {...defaultProps}
        actionLabel="Continue"
        onAction={onAction}
      />,
    )

    vi.advanceTimersByTime(5000)
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<ActionSuccessModal {...defaultProps} open={false} />)

    expect(screen.queryByText('Registration Complete')).toBeNull()
  })
})

// =====================================================================
// 7. AssistedAuditModal (real component)
// =====================================================================

describe('AssistedAuditModal', () => {
  const onClose = vi.fn()

  const events = [
    auditEvent({ id: 1, event: 'ASSISTED_CENTER_ACCESSED', description: 'Opened assisted center' }),
    auditEvent({ id: 2, event: 'assisted.participant_opened', description: 'Opened participant context', actor: 'Jane Admin' }),
    auditEvent({ id: 3, event: 'assisted.participant_registered', description: 'Participant registered' }),
    auditEvent({ id: 4, event: 'assisted.verification_otp_sent', description: 'OTP sent' }),
    auditEvent({ id: 5, event: 'assisted.verification_completed', description: 'Verification completed' }),
    auditEvent({ id: 6, event: 'assisted.pass_issued', description: 'Pass issued' }),
    auditEvent({ id: 7, event: 'assisted.vote_cast', description: 'Vote cast' }),
    auditEvent({ id: 8, event: 'ASSISTED_ACTION_BLOCKED', description: 'Action blocked' }),
  ]

  beforeEach(() => {
    onClose.mockClear()
  })

  it('renders audit events list', () => {
    render(<AssistedAuditModal open onClose={onClose} events={events} />)

    expect(screen.getByText('Opened assisted center')).toBeTruthy()
    expect(screen.getByText('Participant registered')).toBeTruthy()
    expect(screen.getByText('Vote cast')).toBeTruthy()
    expect(screen.getByText('Action blocked')).toBeTruthy()
  })

  it('shows correct icon name for each event type', () => {
    render(<AssistedAuditModal open onClose={onClose} events={events} />)

    expect(screen.getByText('ASSISTED_CENTER_ACCESSED')).toBeTruthy()
    expect(screen.getByText('assisted.participant_opened')).toBeTruthy()
    expect(screen.getByText('assisted.participant_registered')).toBeTruthy()
    expect(screen.getByText('assisted.verification_otp_sent')).toBeTruthy()
    expect(screen.getByText('assisted.verification_completed')).toBeTruthy()
    expect(screen.getByText('assisted.pass_issued')).toBeTruthy()
    expect(screen.getByText('assisted.vote_cast')).toBeTruthy()
    expect(screen.getByText('ASSISTED_ACTION_BLOCKED')).toBeTruthy()
  })

  it('renders empty state when no events', () => {
    render(<AssistedAuditModal open onClose={onClose} events={[]} />)

    expect(screen.getByText('No audit events recorded yet.')).toBeTruthy()
  })

  it('closes on ESC key press', () => {
    render(<AssistedAuditModal open onClose={onClose} events={events} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not render when open is false', () => {
    render(<AssistedAuditModal open={false} onClose={onClose} events={events} />)

    expect(screen.queryByText('Opened assisted center')).toBeNull()
  })

  it('renders custom title', () => {
    render(<AssistedAuditModal open onClose={onClose} events={events} title="Activity Log" />)

    expect(screen.getByText('Activity Log')).toBeTruthy()
  })

  it('renders actors when provided', () => {
    render(<AssistedAuditModal open onClose={onClose} events={events} />)

    expect(screen.getAllByText('Admin User').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Jane Admin')).toBeTruthy()
  })

  it('scrollable content area is present with overflow', () => {
    const { container } = render(
      <AssistedAuditModal open onClose={onClose} events={events} />,
    )

    const scrollable = container.querySelector('.overflow-y-auto')
    expect(scrollable).not.toBeNull()
  })
})
