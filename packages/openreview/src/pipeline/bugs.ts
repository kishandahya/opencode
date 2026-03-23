import type { LanguageModel } from "ai"
import { structured } from "../llm/structured"
import { Finding } from "../types/finding"
import type { FileDiff } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import z from "zod"

function context(diffs: FileDiff[]): string {
  return diffs
    .map((d) => {
      const header = `=== ${d.file} (${d.status}) ===`
      if (d.status === "deleted") return `${header}\n[DELETED]\n${d.before.slice(0, 8000)}`
      if (d.status === "added") return `${header}\n[ADDED]\n${d.after.slice(0, 8000)}`
      return `${header}\n[BEFORE]\n${d.before.slice(0, 4000)}\n[AFTER]\n${d.after.slice(0, 4000)}`
    })
    .join("\n\n")
}

const Schema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      file: z.string(),
      start: z.number(),
      end: z.number(),
      confidence: z.number().min(0).max(1),
      severity: z.enum(["severe", "non-severe", "investigate", "informational"]),
    }),
  ),
})

export async function run(
  model: LanguageModel,
  diffs: FileDiff[],
  emit: (e: PipelineEvent) => void,
): Promise<z.infer<typeof Finding>[]> {
  emit({ type: "progress", phase: "bugs", message: "Scanning for critical bugs..." })

  const ctx = context(diffs)
  const findings: z.infer<typeof Finding>[] = []
  let counter = 0

  // Pass 1: Critical
  const { result: critical } = await structured({
    model,
    schema: Schema,
    system:
      "You are a senior code reviewer focused on finding CRITICAL bugs. Look for: logic errors, security vulnerabilities, data loss risks, crashes, race conditions, broken error handling. Be thorough but precise. Only report real issues with high confidence. For each finding, specify the exact file path and line range.",
    prompt: ctx,
  })

  for (const f of critical.findings) {
    const finding: z.infer<typeof Finding> = {
      id: `bug-${++counter}`,
      ...f,
      category: "bug",
      resolved: false,
    }
    findings.push(finding)
    emit({ type: "finding", finding })
  }

  emit({ type: "progress", phase: "bugs", message: "Scanning for informational issues..." })

  // Pass 2: Informational
  const { result: info } = await structured({
    model,
    schema: Schema,
    system:
      "You are a code reviewer looking for non-critical issues: style violations, naming concerns, test gaps, performance concerns, missing documentation. Be helpful but not nitpicky. Only flag things that would improve code quality.",
    prompt: ctx,
  })

  for (const f of info.findings) {
    const finding: z.infer<typeof Finding> = {
      id: `bug-${++counter}`,
      ...f,
      category: "flag",
      resolved: false,
    }
    findings.push(finding)
    emit({ type: "finding", finding })
  }

  emit({
    type: "progress",
    phase: "bugs",
    message: `Found ${findings.length} issue(s)`,
  })

  return findings
}
