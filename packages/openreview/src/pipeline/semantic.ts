import type { LanguageModel } from "ai"
import { structured } from "../llm/structured"
import { Group } from "../types/group"
import type { FileDiff } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import z from "zod"

export async function run(
  model: LanguageModel,
  diffs: FileDiff[],
  emit: (e: PipelineEvent) => void,
): Promise<z.infer<typeof Group>[]> {
  emit({ type: "progress", phase: "semantic", message: "Grouping files by semantic purpose..." })

  const listing = diffs
    .map(
      (d) =>
        `${d.file} (${d.status}, +${d.additions}/-${d.deletions})`,
    )
    .join("\n")

  const { result } = await structured({
    model,
    schema: z.object({ groups: z.array(Group) }),
    system:
      "You are a code review assistant. Group the changed files by logical feature or concern. Order groups by importance. Each group gets a short title and 1-sentence description. Assign every file to exactly one group.",
    prompt: `Changed files:\n${listing}`,
  })

  for (const g of result.groups) {
    emit({ type: "group", group: g })
  }

  return result.groups
}
