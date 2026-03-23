import type { FileDiff } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"

function jaccard(a: string, b: string): number {
  const lines1 = new Set(a.split("\n").map((l) => l.trim()).filter(Boolean))
  const lines2 = new Set(b.split("\n").map((l) => l.trim()).filter(Boolean))
  if (lines1.size === 0 && lines2.size === 0) return 1
  const intersection = [...lines1].filter((l) => lines2.has(l)).length
  const union = new Set([...lines1, ...lines2]).size
  return union === 0 ? 0 : intersection / union
}

export interface CopyMove {
  from: string
  to: string
  kind: "copy" | "move"
  similarity: number
}

export function run(
  diffs: FileDiff[],
  emit: (e: PipelineEvent) => void,
): CopyMove[] {
  emit({ type: "progress", phase: "copy-move", message: "Detecting copy/move patterns..." })

  const deleted = diffs.filter((d) => d.status === "deleted")
  const added = diffs.filter((d) => d.status === "added")
  const result: CopyMove[] = []

  for (const del of deleted) {
    for (const add of added) {
      const sim = jaccard(del.before, add.after)
      if (sim > 0.6) {
        result.push({
          from: del.file,
          to: add.file,
          kind: sim > 0.8 ? "move" : "copy",
          similarity: sim,
        })
      }
    }
  }

  if (result.length > 0) {
    emit({
      type: "progress",
      phase: "copy-move",
      message: `Found ${result.length} copy/move pattern(s)`,
    })
  }

  return result
}
