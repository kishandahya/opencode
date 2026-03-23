import z from "zod"
import { Finding } from "./finding"
import { Group } from "./group"

export const Phase = z.enum([
  "context",
  "copy-move",
  "semantic",
  "bugs",
  "fix",
  "drift",
  "summary",
])

export type Phase = z.infer<typeof Phase>

export const ProgressEvent = z.object({
  type: z.literal("progress"),
  phase: Phase,
  message: z.string(),
})

export const FindingEvent = z.object({
  type: z.literal("finding"),
  finding: Finding,
})

export const GroupEvent = z.object({
  type: z.literal("group"),
  group: Group,
})

export const SummaryEvent = z.object({
  type: z.literal("summary"),
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

export const ErrorEvent = z.object({
  type: z.literal("error"),
  message: z.string(),
})

export const DoneEvent = z.object({
  type: z.literal("done"),
})

export const PipelineEvent = z.discriminatedUnion("type", [
  ProgressEvent,
  FindingEvent,
  GroupEvent,
  SummaryEvent,
  ErrorEvent,
  DoneEvent,
])

export type PipelineEvent = z.infer<typeof PipelineEvent>
