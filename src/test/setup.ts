import '@testing-library/jest-dom'

if (typeof IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return [] }
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    value: MockIntersectionObserver,
  })
}
