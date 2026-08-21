import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EmailVerificationPage from '../pages/EmailVerificationPage'

const mockedAuth = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  sendVerification: vi.fn(),
  login: vi.fn(),
}))

vi.mock('../services/auth-service', () => ({
  authService: mockedAuth,
}))

vi.mock('motion/react', async () => {
  const React = await import('react')
  return {
    motion: new Proxy({}, {
      get: () => (props: React.PropsWithChildren) => React.createElement('div', props, props.children),
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  }
})

function renderPage(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/org/signin" element={<div>Org Sign In Page</div>} />
        <Route path="/platformsignin" element={<div>Platform Sign In Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  document.cookie = 'orivis_access_token=; path=/; max-age=0'
})

describe('EmailVerificationPage registration-success modal', () => {
  it('shows the success modal after Continue and routes to the org login on Proceed to Login', async () => {
    mockedAuth.verifyEmail.mockResolvedValue(undefined)

    renderPage('/verify-email?token=abc&email=admin%40acme.com&org=Acme')

    await waitFor(() => expect(screen.getByText('Email Verified')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Continue to Acme/i }))

    expect(screen.getByText('Account Registration Successful')).toBeInTheDocument()
    expect(screen.getByText(/proceed to login to access your organization workspace/i)).toBeInTheDocument()
    expect(screen.queryByText('Org Sign In Page')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Proceed to Login/i }))

    await waitFor(() => expect(screen.getByText('Org Sign In Page')).toBeInTheDocument())
  })

  it('does not auto-authenticate the user when continuing', async () => {
    mockedAuth.verifyEmail.mockResolvedValue(undefined)

    renderPage('/verify-email?token=abc&email=admin%40acme.com&org=Acme')

    await waitFor(() => expect(screen.getByText('Email Verified')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Continue to Acme/i }))
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Login/i }))

    await waitFor(() => expect(screen.getByText('Org Sign In Page')).toBeInTheDocument())

    expect(mockedAuth.login).not.toHaveBeenCalled()
    expect(document.cookie).not.toContain('orivis_access_token')
  })

  it('routes to the platform sign-in when no org is present', async () => {
    mockedAuth.verifyEmail.mockResolvedValue(undefined)

    renderPage('/verify-email?token=abc&email=user%40example.com')

    await waitFor(() => expect(screen.getByText('Email Verified')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Login/i }))

    await waitFor(() => expect(screen.getByText('Platform Sign In Page')).toBeInTheDocument())
  })

  it('does not show the success modal when verification fails', async () => {
    mockedAuth.verifyEmail.mockRejectedValue(new Error('invalid token'))

    renderPage('/verify-email?token=bad&email=admin%40acme.com&org=Acme')

    await waitFor(() => expect(screen.getByText('Verification Failed')).toBeInTheDocument())

    expect(screen.queryByText('Account Registration Successful')).not.toBeInTheDocument()
  })
})
