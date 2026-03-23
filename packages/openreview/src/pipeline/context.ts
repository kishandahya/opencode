import * as Github from "../github"
import type { PipelineEvent } from "../types/pipeline"
import type { PR } from "../types/pr"
import type { FileDiff } from "../types/review"

export async function run(
  url: string,
  token: string | undefined,
  emit: (e: PipelineEvent) => void,
): Promise<{ pr: PR; diffs: FileDiff[] }> {
  emit({ type: "progress", phase: "context", message: "Parsing PR URL..." })
  const parsed = Github.parse(url)

  emit({ type: "progress", phase: "context", message: "Fetching PR metadata..." })
  const result = await Github.fetch({ ...parsed, token })

  emit({
    type: "progress",
    phase: "context",
    message: `Loaded ${result.diffs.length} files from ${parsed.owner}/${parsed.repo}#${parsed.number}`,
  })
  return result
}
