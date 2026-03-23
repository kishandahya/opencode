import type { LanguageModel } from "ai"
import { structured } from "../llm/structured"
import type { Finding } from "../types/finding"
import type { FileDiff } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import z from "zod"

const Schema = z.object({
  code: z.string(),
  explanation: z.string(),
})

export async function run(
  model: LanguageModel,
  findings: Finding[],
  diffs: FileDiff[],
  emit: (e: PipelineEvent) => void,
): Promise<Finding[]> {
  const fixable = findings.filter((f) => f.confidence > 0.7 && !f.fix)
  if (fixable.length === 0) return findings

  emit({
    type: "progress",
    phase: "fix",
    message: `Generating fixes for ${fixable.length} finding(s)...`,
  })

  const lookup = new Map(diffs.map((d) => [d.file, d]))

  for (const f of fixable) {
    const diff = lookup.get(f.file)
    if (!diff) continue

    try {
      const { result } = await structured({
        model,
        schema: Schema,
        system:
          "You are a code fix assistant. Given a bug finding and the file contents, generate a minimal code fix. Return only the corrected code snippet (not the entire file) and a brief explanation.",
        prompt: `Bug: ${f.title}\nDescription: ${f.description}\nFile: ${f.file} lines ${f.start}-${f.end}\n\nFile contents:\n${diff.after.slice(0, 8000)}`,
      })
      f.fix = result
    } catch {
      // skip if fix generation fails
    }
  }

  return findings
}
