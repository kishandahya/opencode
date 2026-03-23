import { Octokit } from "@octokit/rest"
import type { PR } from "../types/pr"
import type { FileDiff } from "../types/review"

export async function fetch(opts: {
  owner: string
  repo: string
  number: number
  token?: string
}): Promise<{ pr: PR; diffs: FileDiff[] }> {
  const kit = new Octokit({ auth: opts.token ?? process.env.GITHUB_TOKEN })

  const { data: raw } = await kit.pulls.get({
    owner: opts.owner,
    repo: opts.repo,
    pull_number: opts.number,
  })

  const status = raw.merged ? "merged" : raw.state === "closed" ? "closed" : "open"

  let checks: { passed: number; total: number } | undefined
  try {
    const { data: runs } = await kit.checks.listForRef({
      owner: opts.owner,
      repo: opts.repo,
      ref: raw.head.sha,
    })
    const total = runs.total_count
    const passed = runs.check_runs.filter((r) => r.conclusion === "success").length
    checks = { passed, total }
  } catch {
    // checks may not be available
  }

  const reviewers = (raw.requested_reviewers ?? [])
    .filter((r) => r && "login" in r)
    .map((r) => (r as { login: string }).login)

  const pr: PR = {
    owner: opts.owner,
    repo: opts.repo,
    number: opts.number,
    title: raw.title,
    body: raw.body ?? "",
    status,
    head: raw.head.ref,
    base: raw.base.ref,
    author: raw.user?.login ?? "unknown",
    labels: raw.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")),
    checks,
    reviewers,
  }

  // GitHub clamps per_page to 100 — paginate to get all files
  const files: Awaited<ReturnType<typeof kit.pulls.listFiles>>["data"] = []
  let page = 1
  while (true) {
    const { data: batch } = await kit.pulls.listFiles({
      owner: opts.owner,
      repo: opts.repo,
      pull_number: opts.number,
      per_page: 100,
      page,
    })
    files.push(...batch)
    if (batch.length < 100) break
    page++
  }

  const diffs: FileDiff[] = await Promise.all(
    files
      .filter((f) => !f.filename.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|svg)$/i))
      .map(async (f) => {
        const stat =
          f.status === "added"
            ? "added"
            : f.status === "removed"
              ? "deleted"
              : f.status === "renamed"
                ? "renamed"
                : "modified"

        let before = ""
        let after = ""

        if (stat !== "added") {
          try {
            const { data } = await kit.repos.getContent({
              owner: opts.owner,
              repo: opts.repo,
              path: f.previous_filename ?? f.filename,
              ref: raw.base.sha,
            })
            if ("content" in data && data.content) {
              before = Buffer.from(data.content, "base64").toString("utf-8")
            }
          } catch {
            // file may not exist at base
          }
        }

        if (stat !== "deleted") {
          try {
            const { data } = await kit.repos.getContent({
              owner: opts.owner,
              repo: opts.repo,
              path: f.filename,
              ref: raw.head.sha,
            })
            if ("content" in data && data.content) {
              after = Buffer.from(data.content, "base64").toString("utf-8")
            }
          } catch {
            // file may not exist at head
          }
        }

        return {
          file: f.filename,
          before,
          after,
          additions: f.additions,
          deletions: f.deletions,
          status: stat,
        } satisfies FileDiff
      }),
  )

  return { pr, diffs }
}
