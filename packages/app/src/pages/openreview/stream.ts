import { onCleanup } from "solid-js"
import type { ReviewStore, ReviewPR, ReviewDiff, ReviewFinding, ReviewGroup, ReviewSummary } from "./store"
import { ReviewAPI } from "./api"

interface ReviewSnapshot {
  pr?: ReviewPR
  diffs?: ReviewDiff[]
  findings?: ReviewFinding[]
  groups?: ReviewGroup[]
  summary?: ReviewSummary
  status?: string
}

export function createReviewStream(id: string, store: ReviewStore) {
  let source: EventSource | undefined
  let retries = 0
  const MAX = 5
  const BASE = 1000

  // Hydrate initial state from REST API
  ReviewAPI.get(id).then((data) => {
    const snap = data as ReviewSnapshot
    if (snap.pr) store.setPR(snap.pr)
    if (snap.diffs?.length) store.setDiffs(snap.diffs)
    if (snap.findings?.length) {
      for (const f of snap.findings) store.addFinding(f)
    }
    if (snap.groups?.length) {
      for (const g of snap.groups) store.addGroup(g)
    }
    if (snap.summary) store.setSummary(snap.summary)
    if (snap.status === "done") store.setStatus("done")
    if (snap.status === "error") store.setError("Review failed")
  }).catch(() => {
    // Initial hydration failed — SSE events will still populate state
  })

  function connect() {
    source = new EventSource(ReviewAPI.streamUrl(id))

    source.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data)
      store.addProgress(data.message)
      store.setStatus("running")
    })

    source.addEventListener("finding", (e) => {
      const data = JSON.parse(e.data)
      store.addFinding(data.finding)
    })

    source.addEventListener("group", (e) => {
      const data = JSON.parse(e.data)
      store.addGroup(data.group)
    })

    source.addEventListener("summary", (e) => {
      const data = JSON.parse(e.data)
      store.setSummary({
        verdict: data.verdict,
        confidence: data.confidence,
        text: data.text,
        counts: data.counts,
      })
    })

    source.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data)
        store.setError(data.message)
      }
    })

    source.addEventListener("done", () => {
      store.setStatus("done")
      source?.close()
    })

    source.onerror = () => {
      source?.close()
      if (retries < MAX) {
        retries++
        setTimeout(connect, BASE * Math.pow(2, retries))
      }
    }
  }

  connect()

  onCleanup(() => {
    source?.close()
  })
}
