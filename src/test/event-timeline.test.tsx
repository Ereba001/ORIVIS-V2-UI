/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EventTimeline from '../org/components/EventTimeline'
import type { TimelineActivity } from '../org/types'

function activity(type: string, i: number): TimelineActivity {
  return {
    id: `a${i}`,
    action: `Action ${i}`,
    description: `Description ${i}`,
    timestamp: new Date().toISOString(),
    type: type as TimelineActivity['type'],
    user: 'Admin',
  }
}

describe('EventTimeline', () => {
  it('renders every backend activity type without crashing', () => {
    const types = [
      'create', 'update', 'delete', 'approve', 'reject', 'publish', 'complete',
      'import', 'status_change', 'cancel', 'alert', 'system',
    ]
    render(<EventTimeline activities={types.map((t, i) => activity(t, i))} />)

    expect(screen.getByText('Action 0')).toBeTruthy()
    expect(screen.getByText(`Description ${types.length - 1}`)).toBeTruthy()
  })

  it('does not crash on an unknown future activity type', () => {
    render(<EventTimeline activities={[activity('some-future-type', 42)]} />)

    expect(screen.getByText('Action 42')).toBeTruthy()
  })
})