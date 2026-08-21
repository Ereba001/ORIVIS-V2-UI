import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import VotingPassInput from '../components/VotingPassInput'

const srcRoot = resolve(process.cwd(), 'src')

/**
 * Regression test for the voting-pass input fix: the issued voting pass is a
 * single complete code (e.g. `ABC-123456-ORV`), NOT a segmented PIN. The input
 * must accept the complete pass exactly as issued — including pasted values
 * with hyphens — and pass it through to the backend untouched for validation.
 */
describe('VotingPassInput (single field)', () => {
  it('accepts the complete hyphenated pass as typed', () => {
    const onChange = vi.fn()
    render(<VotingPassInput value="" onChange={onChange} />)

    const input = screen.getByLabelText('Voting pass')
    fireEvent.change(input, { target: { value: 'ABC-123456-ORV' } })

    expect(onChange).toHaveBeenCalledWith('ABC-123456-ORV')
  })

  it('passes a pasted pass through with hyphens intact', () => {
    const onChange = vi.fn()
    render(<VotingPassInput value="" onChange={onChange} />)

    const input = screen.getByLabelText('Voting pass')
    fireEvent.change(input, { target: { value: '  XYZ-9K4M2P-ORV\n' } })

    // Only surrounding whitespace is trimmed — hyphens/casing are preserved so
    // the server can match the complete code exactly.
    expect(onChange).toHaveBeenCalledWith('XYZ-9K4M2P-ORV')
  })

  it('does not split the value into hyphen-stripped segments', () => {
    const onChange = vi.fn()
    render(<VotingPassInput value="" onChange={onChange} />)

    const input = screen.getByLabelText('Voting pass')
    fireEvent.change(input, { target: { value: 'ORG-ABCDEF-ORV' } })

    expect(onChange).not.toHaveBeenCalledWith(expect.not.stringContaining('-'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('preserves a long 64-char token unchanged (admin token flow)', () => {
    const onChange = vi.fn()
    render(<VotingPassInput value="" onChange={onChange} />)

    const longToken = 'a'.repeat(64)
    const input = screen.getByLabelText('Voting pass')
    fireEvent.change(input, { target: { value: longToken } })

    expect(onChange).toHaveBeenCalledWith(longToken)
  })

  it('renders a single input element (not one per segment)', () => {
    render(<VotingPassInput value="ABC-123456-ORV" onChange={() => {}} />)
    expect(screen.getAllByLabelText('Voting pass')).toHaveLength(1)
  })
})

describe('voting pass input source guard', () => {
  it('no longer splits the pass into a 4x4 segmented PIN anywhere', () => {
    // The old segmented input grouped the pass into 4x4 boxes and stripped
    // hyphens — a real issued pass (ABC-123456-ORV) could never be entered.
    // This guard keeps that broken pattern from reappearing.
    const consoleFile = readFileSync(join(srcRoot, 'pages/elections/VoterConsole.tsx'), 'utf8')
    const authFile = readFileSync(join(srcRoot, 'pages/elections/VoteAuth.tsx'), 'utf8')
    const directVote = readFileSync(join(srcRoot, 'org/components/DirectVoteModal.tsx'), 'utf8')

    for (const content of [consoleFile, authFile, directVote]) {
      expect(content).not.toMatch(/length < 16/)
      expect(content).not.toMatch(/passCode\.length < 16|fullToken\.length < 16/)
    }
  })

  it('never places the raw token in the URL (history/referrer leak)', () => {
    const authFile = readFileSync(join(srcRoot, 'pages/elections/VoteAuth.tsx'), 'utf8')
    const boothFile = readFileSync(join(srcRoot, 'pages/elections/VotingBooth.tsx'), 'utf8')

    expect(authFile).not.toMatch(/\/vote\?token=/)
    expect(authFile).toMatch(/sessionStorage\.setItem\("orivis_vote_token"/)
    expect(boothFile).toMatch(/orivis_vote_token/)
  })
})
