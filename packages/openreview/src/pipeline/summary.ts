import type { LanguageModel } from "ai"
import { structured } from "../llm/structured"
import type { Finding } from "../types/finding"
import type { Summary } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import z from "zod"

const Schema = z.object({
  text: z.string(),
})

export async function run(
  model: LanguageModel,
  findings: Finding[],
  emit: (e: PipelineEvent) => void,
): Promise<Summary> {
  emit({ type: "progress", phase: "summary", message: "Generating summary..." })

  const severe = findings.filter((f) => f.severity === "severe").length
  const nonSevere = findings.filter((f) => f.severity === "non-severe").length
  const investigate = findings.filter((f) => f.severity === "investigate").length
  const informational = findings.filter((f) => f.severity === "informational").length
  const flags = findings.filter((f) => f.category === "flag").length

  const avg =
    findings.length > 0
      ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
      : 1

  const listing = findings
    .map((f) => `- [${f.severity}] ${f.title} (${f.file}:${f.start})`)
    .join("\n")

  const { result } = await structured({
    model,
    schema: Schema,
    system:
      "You are a code review assistant. Write a concise 2-3 sentence summary of the review findings. Mention the most important issues and the overall quality of the PR.",
    prompt: `Findings:\n${listing || "No issues found."}`,
  })

  const summary: Summary = {
    verdict: severe > 0 ? "fail" : "pass",
    confidence: Math.round(avg * 100) / 100,
    text: result.text,
    counts: { severe, nonSevere, investigate, informational, flags },
  }

  emit({
    type: "summary",
    ...summary,
  })

  return summary
}
