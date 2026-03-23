import z from "zod"
import { Config } from "./config"
import { Finding } from "./finding"
import { Group } from "./group"
import { PR } from "./pr"
import { Message } from "./chat"

export const CopyMoveEntry = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(["copy", "move"]),
  similarity: z.number(),
})

export const FileDiff = z
  .object({
    file: z.string(),
    before: z.string(),
    after: z.string(),
    additions: z.number(),
    deletions: z.number(),
    status: z.enum(["added", "modified", "deleted", "renamed"]),
  })
  .meta({ ref: "FileDiff" })

export type FileDiff = z.infer<typeof FileDiff>

export const Summary = z
  .object({
    verdict: z.enum(["pass", "fail"]),
    confidence: z.number(),
    text: z.string(),
    counts: z.object({
      severe: z.number(),
      nonSevere: z.number(),
      investigate: z.number(),
      informational: z.number(),
      flags: z.number(),
    }),
  })
  .meta({ ref: "ReviewSummary" })

export type Summary = z.infer<typeof Summary>

export const Review = z
  .object({
    id: z.string(),
    status: z.enum(["pending", "running", "done", "error"]),
    url: z.string(),
    pr: PR.optional(),
    config: Config,
    diffs: z.array(FileDiff),
    copyMoves: z.array(CopyMoveEntry).default([]),
    findings: z.array(Finding),
    groups: z.array(Group),
    summary: Summary.optional(),
    messages: z.array(Message),
    created: z.number(),
    updated: z.number(),
  })
  .meta({ ref: "Review" })

export type Review = z.infer<typeof Review>
