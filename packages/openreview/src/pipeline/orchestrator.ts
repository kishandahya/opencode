import type { Config } from "../types/config"
import type { Review } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import { model } from "../llm/provider"
import * as Context from "./context"
import * as CopyMove from "./copy-move"
import * as Semantic from "./semantic"
import * as Bugs from "./bugs"
import * as Fix from "./fix"
import * as Drift from "./drift"
import * as Summary from "./summary"

const sessions = new Map<string, Review>()
const listeners = new Map<string, Set<(e: PipelineEvent) => void>>()

// Evict completed sessions after 30 minutes
const TTL = 30 * 60 * 1000
const MAX_SESSIONS = 50

function evict() {
  const now = Date.now()
  for (const [sid, review] of sessions) {
    if ((review.status === "done" || review.status === "error") && now - review.updated > TTL) {
      sessions.delete(sid)
      listeners.delete(sid)
    }
  }
  // Hard cap: remove oldest if over limit
  if (sessions.size > MAX_SESSIONS) {
    const sorted = [...sessions.entries()].sort((a, b) => a[1].updated - b[1].updated)
    const excess = sessions.size - MAX_SESSIONS
    for (let i = 0; i < excess; i++) {
      sessions.delete(sorted[i][0])
      listeners.delete(sorted[i][0])
    }
  }
}

function id(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function get(sid: string): Review | undefined {
  return sessions.get(sid)
}

export function subscribe(sid: string, cb: (e: PipelineEvent) => void): () => void {
  if (!listeners.has(sid)) listeners.set(sid, new Set())
  listeners.get(sid)!.add(cb)
  return () => listeners.get(sid)?.delete(cb)
}

export async function run(
  url: string,
  cfg: Config,
  emit?: (e: PipelineEvent) => void,
): Promise<string> {
  evict()
  const sid = id()
  const now = Date.now()

  const review: Review = {
    id: sid,
    status: "pending",
    url,
    config: cfg,
    diffs: [],
    copyMoves: [],
    findings: [],
    groups: [],
    messages: [],
    created: now,
    updated: now,
  }

  sessions.set(sid, review)

  const broadcast = (e: PipelineEvent) => {
    emit?.(e)
    listeners.get(sid)?.forEach((cb) => cb(e))
  }

  // Run pipeline async
  ;(async () => {
    try {
      review.status = "running"
      review.updated = Date.now()

      // Phase 0: Context (use GITHUB_TOKEN env var, not LLM API key)
      const { pr, diffs } = await Context.run(url, process.env.GITHUB_TOKEN, broadcast)
      review.pr = pr
      review.diffs = diffs
      review.updated = Date.now()

      // Phase 1: Copy/Move
      review.copyMoves = CopyMove.run(diffs, broadcast)

      // Phase 2: Semantic Grouping
      const llm = await model(cfg)
      const groups = await Semantic.run(llm, diffs, broadcast)
      review.groups = groups
      review.updated = Date.now()

      // Phase 3: Bug Detection
      const bugs = await Bugs.run(llm, diffs, broadcast)
      review.findings = bugs
      review.updated = Date.now()

      // Phase 4: Auto-Fix
      await Fix.run(llm, review.findings, diffs, broadcast)
      review.updated = Date.now()

      // Phase 5: Scope Drift
      const flags = await Drift.run(llm, pr, diffs, broadcast)
      review.findings = [...review.findings, ...flags]
      review.updated = Date.now()

      // Phase 6: Summary
      const summary = await Summary.run(llm, review.findings, broadcast)
      review.summary = summary
      review.status = "done"
      review.updated = Date.now()

      broadcast({ type: "done" })
    } catch (err) {
      review.status = "error"
      review.updated = Date.now()
      broadcast({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      })
    }
  })()

  return sid
}
