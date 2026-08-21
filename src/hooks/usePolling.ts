import { useEffect, useRef } from "react"

/**
 * Polls `fn` every `intervalMs` while `enabled` is true.
 *
 * The UI must derive election/lifecycle state from the authoritative backend —
 * never from client timers. This hook lets pages refresh their server state so
 * scheduled transitions (registration open/close, voting open/close, end,
 * archive) become visible without a manual reload.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      try {
        await fnRef.current()
      } catch {
        // A transient poll failure must never take down the page; the next
        // tick retries. Real errors still surface through the data fetch
        // itself (initial load / explicit refresh paths).
      }
    }

    const id = window.setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [intervalMs, enabled])
}
