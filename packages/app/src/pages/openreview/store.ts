import { createStore } from "solid-js/store"

export interface ReviewFinding {
  id: string
  title: string
  description: string
  file: string
  start: number
  end: number
  category: "bug" | "flag"
  confidence: number
  severity: "severe" | "non-severe" | "investigate" | "informational"
  fix?: { code: string; explanation: string }
  resolved: boolean
}

export interface ReviewGroup {
  title: string
  description: string
  files: Array<{ path: string; additions: number; deletions: number }>
  order: number
}

export interface ReviewPR {
  owner: string
  repo: string
  number: number
  title: string
  body: string
  status: "open" | "closed" | "merged"
  head: string
  base: string
  author: string
  labels: string[]
  checks?: { passed: number; total: number }
  reviewers: string[]
}

export interface ReviewDiff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
  status: "added" | "modified" | "deleted" | "renamed"
}

export interface ReviewSummary {
  verdict: "pass" | "fail"
  confidence: number
  text: string
  counts: {
    severe: number
    nonSevere: number
    investigate: number
    informational: number
    flags: number
  }
}

export interface ReviewState {
  status: "idle" | "running" | "done" | "error"
  pr: ReviewPR | undefined
  diffs: ReviewDiff[]
  findings: ReviewFinding[]
  groups: ReviewGroup[]
  summary: ReviewSummary | undefined
  progress: string[]
  error: string | undefined
}

export function createReviewStore() {
  const [state, set] = createStore<ReviewState>({
    status: "idle",
    pr: undefined,
    diffs: [],
    findings: [],
    groups: [],
    summary: undefined,
    progress: [],
    error: undefined,
  })

  return {
    state,
    setStatus(s: ReviewState["status"]) {
      set("status", s)
    },
    setPR(pr: ReviewPR) {
      set("pr", pr)
    },
    setDiffs(diffs: ReviewDiff[]) {
      set("diffs", diffs)
    },
    addFinding(f: ReviewFinding) {
      set("findings", (prev) => [...prev, f])
    },
    addGroup(g: ReviewGroup) {
      set("groups", (prev) => [...prev, g])
    },
    setSummary(s: ReviewSummary) {
      set("summary", s)
    },
    addProgress(msg: string) {
      set("progress", (prev) => [...prev, msg])
    },
    setError(msg: string) {
      set("error", msg)
      set("status", "error")
    },
    toggleResolved(fid: string) {
      set(
        "findings",
        (f) => f.id === fid,
        "resolved",
        (v) => !v,
      )
    },
    reset() {
      set({
        status: "idle",
        pr: undefined,
        diffs: [],
        findings: [],
        groups: [],
        summary: undefined,
        progress: [],
        error: undefined,
      })
    },
  }
}

export type ReviewStore = ReturnType<typeof createReviewStore>
