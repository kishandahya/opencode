import type { LanguageModel } from "ai"
import { structured } from "../llm/structured"
import type { Finding } from "../types/finding"
import type { PR } from "../types/pr"
import type { FileDiff } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import z from "zod"

const Schema = z.object({
  flags: z.array(
    z.object({
      file: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
})

export async function run(
  model: LanguageModel,
  pr: PR,
  diffs: FileDiff[],
  emit: (e: PipelineEvent) => void,
): Promise<Finding[]> {
  emit({ type: "progress", phase: "drift", message: "Checking for scope drift..." })

  const listing = diffs.map((d) => d.file).join("\n")

  const { result } = await structured({
    model,
    schema: Schema,
    system:
      "You are a code review assistant checking for scope drift. Compare the PR title and description against the actual changed files. Flag any files that seem unrelated to the stated purpose of the PR. Be conservative -- only flag clear mismatches.",
    prompt: `PR Title: ${pr.title}\nPR Description: ${pr.body.slice(0, 2000)}\n\nChanged files:\n${listing}`,
  })

  let counter = 0
  const findings: Finding[] = result.flags.map((f) => ({
    id: `drift-${++counter}`,
    title: `Scope drift: ${f.file}`,
    description: f.reason,
    file: f.file,
    start: 1,
    end: 1,
    category: "flag" as const,
    confidence: f.confidence,
    severity: "investigate" as const,
    resolved: false,
  }))

  for (const f of findings) {
    emit({ type: "finding", finding: f })
  }

  return findings
}
