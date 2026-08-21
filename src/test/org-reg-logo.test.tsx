import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OrgRegistrationPage from '../pages/OrgRegistrationPage'

vi.mock('../services/auth-service', () => ({
  authService: {
    register: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('motion/react', async () => {
  const React = await import('react')
  return {
    motion: new Proxy({}, {
      get: () => (props: React.PropsWithChildren<{ children: React.ReactNode }>) => React.createElement('div', props, props.children),
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  }
})

let createObjectURLMock: ReturnType<typeof vi.fn>
let revokeObjectURLMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  createObjectURLMock = vi.fn(() => 'blob:mock-logo')
  revokeObjectURLMock = vi.fn()
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: createObjectURLMock,
    revokeObjectURL: revokeObjectURLMock,
  })
})

function fillDetails() {
  fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { value: 'Acme Corp' } })
  fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'ACME' } })
  fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Corporate / Business' } })
  fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '08012345678' } })
  fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'Nigeria' } })
  fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Abcd1234!' } })
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Abcd1234!' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /I confirm that the information provided is accurate/i }))
  const form = document.querySelector('form')
  if (!form) throw new Error('form not found')
  fireEvent.submit(form)
}

describe('OrgRegistrationPage logo thumbnail', () => {
  it('shows a blob preview thumbnail after selecting a logo file', async () => {
    render(
      <MemoryRouter>
        <OrgRegistrationPage />
      </MemoryRouter>
    )

    fillDetails()

    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>'], 'logo.svg', { type: 'image/svg+xml' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled()
    })

    const thumbs = document.querySelectorAll('img[alt="Logo preview"], img[alt="Logo"]')
    expect(thumbs.length).toBeGreaterThan(0)
    expect(thumbs[0].getAttribute('src')).toBe('blob:mock-logo')
  }, 15000)
})
