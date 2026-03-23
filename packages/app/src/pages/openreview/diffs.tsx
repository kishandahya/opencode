import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import type { ReviewStore } from "./store"
import "./diffs.css"

export function Diffs(props: { store: ReviewStore; focused?: string }) {
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())

  const toggle = (file: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(file)) {
        next.delete(file)
      } else {
        next.add(file)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpanded(new Set(props.store.state.diffs.map((d) => d.file)))
  }

  const collapseAll = () => {
    setExpanded(new Set<string>())
  }

  createEffect(() => {
    const file = props.focused
    if (!file) return
    setExpanded((prev) => {
      if (prev.has(file)) return prev
      const next = new Set(prev)
      next.add(file)
      return next
    })
    const el = document.querySelector(`[data-diff-file="${CSS.escape(file)}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })

  return (
    <div data-component="openreview-diffs">
      <Show when={props.store.state.diffs.length > 0}>
        <div data-slot="toolbar">
          <span data-slot="file-count">
            {props.store.state.diffs.length} files changed
          </span>
          <button data-slot="action" onClick={expandAll}>
            Expand all
          </button>
          <button data-slot="action" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
      </Show>
      <div data-slot="list">
        <For each={props.store.state.diffs}>
          {(diff) => {
            const isOpen = () => expanded().has(diff.file)
            const filename = () => diff.file.split("/").pop() ?? diff.file
            const dir = () => {
              const parts = diff.file.split("/")
              if (parts.length <= 1) return ""
              return parts.slice(0, -1).join("/") + "/"
            }

            return (
              <div data-slot="file-block" data-diff-file={diff.file}>
                <button data-slot="file-header" onClick={() => toggle(diff.file)}>
                  <span data-slot="chevron" data-open={isOpen()}>
                    &#9654;
                  </span>
                  <span data-slot="status-badge" data-status={diff.status}>
                    {diff.status === "added"
                      ? "A"
                      : diff.status === "deleted"
                        ? "D"
                        : diff.status === "renamed"
                          ? "R"
                          : "M"}
                  </span>
                  <span data-slot="file-path">
                    <Show when={dir()}>
                      <span data-slot="dir">{dir()}</span>
                    </Show>
                    <span data-slot="name">{filename()}</span>
                  </span>
                  <span data-slot="changes">
                    <span data-slot="additions">+{diff.additions}</span>
                    <span data-slot="deletions">-{diff.deletions}</span>
                  </span>
                </button>
                <Show when={isOpen()}>
                  <div data-slot="diff-content">
                    <DiffView before={diff.before} after={diff.after} />
                  </div>
                </Show>
              </div>
            )
          }}
        </For>
      </div>
      <Show when={props.store.state.diffs.length === 0 && props.store.state.status === "running"}>
        <div data-slot="loading">Loading file diffs...</div>
      </Show>
    </div>
  )
}

interface DiffLine {
  type: "context" | "add" | "remove"
  oldNum: number | undefined
  newNum: number | undefined
  text: string
}

function computeDiff(before: string, after: string): DiffLine[] {
  const oldLines = before.split("\n")
  const newLines = after.split("\n")
  const lines: DiffLine[] = []

  // Pre-compute Set lookups for O(1) membership tests
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)

  let oldIdx = 0
  let newIdx = 0

  // Simple line-by-line diff (not a full LCS, but good enough for display)
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldIdx < oldLines.length ? oldLines[oldIdx] : undefined
    const newLine = newIdx < newLines.length ? newLines[newIdx] : undefined

    if (oldLine === newLine) {
      lines.push({
        type: "context",
        oldNum: oldIdx + 1,
        newNum: newIdx + 1,
        text: oldLine ?? "",
      })
      oldIdx++
      newIdx++
    } else if (oldLine !== undefined && (newLine === undefined || !newSet.has(oldLine))) {
      lines.push({
        type: "remove",
        oldNum: oldIdx + 1,
        newNum: undefined,
        text: oldLine,
      })
      oldIdx++
    } else if (newLine !== undefined && (oldLine === undefined || !oldSet.has(newLine))) {
      lines.push({
        type: "add",
        oldNum: undefined,
        newNum: newIdx + 1,
        text: newLine,
      })
      newIdx++
    } else {
      // Both exist but differ - show as remove then add
      lines.push({
        type: "remove",
        oldNum: oldIdx + 1,
        newNum: undefined,
        text: oldLine ?? "",
      })
      oldIdx++
    }

    // Safety: prevent infinite loops on very large files
    if (lines.length > 10000) break
  }

  return lines
}

function DiffView(props: { before: string; after: string }) {
  const lines = createMemo(() => computeDiff(props.before, props.after))

  return (
    <div data-slot="diff-table">
      <For each={lines()}>
        {(line) => (
          <div data-slot="diff-line" data-type={line.type}>
            <span data-slot="line-num" data-side="old">
              {line.oldNum ?? ""}
            </span>
            <span data-slot="line-num" data-side="new">
              {line.newNum ?? ""}
            </span>
            <span data-slot="line-marker">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            <span data-slot="line-text">{line.text}</span>
          </div>
        )}
      </For>
    </div>
  )
}
