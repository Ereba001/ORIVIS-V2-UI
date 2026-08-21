import { describe, it, expect, beforeEach } from 'vitest'
import { authTokens, isSameIdentity } from '../lib/auth'

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
})

describe('authTokens session isolation', () => {
  it('stores tokens in sessionStorage, not localStorage', () => {
    authTokens.setTokens('access-1', 'refresh-1')

    expect(window.sessionStorage.getItem('orivis_access_token')).toBe('access-1')
    expect(window.sessionStorage.getItem('orivis_refresh_token')).toBe('refresh-1')
    expect(window.localStorage.getItem('orivis_access_token')).toBeNull()
    expect(window.localStorage.getItem('orivis_refresh_token')).toBeNull()

    expect(authTokens.getAccessToken()).toBe('access-1')
    expect(authTokens.getRefreshToken()).toBe('refresh-1')
    expect(authTokens.hasTokens()).toBe(true)
  })

  it('setTokens without a refresh token clears any previously stored refresh token', () => {
    authTokens.setTokens('access-1', 'refresh-1')
    authTokens.setTokens('access-2')

    expect(authTokens.getAccessToken()).toBe('access-2')
    expect(authTokens.getRefreshToken()).toBeNull()
  })

  it('clearTokens removes both tokens', () => {
    authTokens.setTokens('access-1', 'refresh-1')
    authTokens.clearTokens()

    expect(authTokens.getAccessToken()).toBeNull()
    expect(authTokens.getRefreshToken()).toBeNull()
    expect(authTokens.hasTokens()).toBe(false)
  })

  it('tokens from a previous session do not leak into a fresh tab (sessionStorage is per-tab)', () => {
    authTokens.setTokens('access-tab-1')

    // Simulates a newly opened tab: its sessionStorage starts empty even though
    // a sibling tab has written tokens (the old shared-localStorage corruption).
    const freshTab = new Map<string, string>()
    expect(freshTab.get('orivis_access_token')).toBeUndefined()
    expect(authTokens.getAccessToken()).toBe('access-tab-1')
  })
})

describe('isSameIdentity refresh fail-safe', () => {
  it('accepts a refresh whose user matches the current user', () => {
    expect(isSameIdentity({ id: 'u1' }, { id: 'u1' })).toBe(true)
  })

  it('rejects a refresh whose user differs from the current user', () => {
    expect(isSameIdentity({ id: 'u1' }, { id: 'u2' })).toBe(false)
  })

  it('rejects a refresh that returns no user while a user is present', () => {
    expect(isSameIdentity({ id: 'u1' }, null)).toBe(false)
  })

  it('accepts a refresh with a user when no user is currently loaded', () => {
    expect(isSameIdentity(null, { id: 'u1' })).toBe(true)
  })
})