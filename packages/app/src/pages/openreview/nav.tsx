import { createSignal, For, Show } from "solid-js"
import type { ReviewStore } from "./store"
import "./nav.css"

export function Nav(props: { store: ReviewStore; onSelect: (file: string) => void }) {
  const [view, setView] = createSignal<"sections" | "tree">("sections")

  return (
    <div data-component="openreview-nav">
      <div data-slot="header">
        <button
          data-slot="tab"
          data-active={view() === "sections"}
          onClick={() => setView("sections")}
        >
          Sections
        </button>
        <button
          data-slot="tab"
          data-active={view() === "tree"}
          onClick={() => setView("tree")}
        >
          Files
        </button>
      </div>
      <div data-slot="content">
        <Show when={view() === "sections"}>
          <Sections store={props.store} onSelect={props.onSelect} />
        </Show>
        <Show when={view() === "tree"}>
          <Tree store={props.store} onSelect={props.onSelect} />
        </Show>
      </div>
    </div>
  )
}

function Sections(props: { store: ReviewStore; onSelect: (file: string) => void }) {
  return (
    <div data-slot="sections">
      <Show
        when={props.store.state.groups.length > 0}
        fallback={
          <div data-slot="empty">
            <Show when={props.store.state.status === "running"} fallback="No groups yet">
              Analyzing files...
            </Show>
          </div>
        }
      >
        <For each={props.store.state.groups}>
          {(group, idx) => (
            <div data-slot="group">
              <div data-slot="group-header">
                <span data-slot="group-number">{idx() + 1}.</span>
                <span data-slot="group-title">{group.title}</span>
                <span data-slot="group-count">{group.files.length} files</span>
              </div>
              <div data-slot="group-desc">{group.description}</div>
              <For each={group.files}>
                {(file) => (
                  <button data-slot="file" onClick={() => props.onSelect(file.path)}>
                    <span data-slot="file-name">{file.path.split("/").pop()}</span>
                    <span data-slot="file-changes">
                      <span data-slot="additions">+{file.additions}</span>
                      <span data-slot="deletions">-{file.deletions}</span>
                    </span>
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}

function Tree(props: { store: ReviewStore; onSelect: (file: string) => void }) {
  return (
    <div data-slot="tree">
      <Show
        when={props.store.state.diffs.length > 0}
        fallback={<div data-slot="empty">No files yet</div>}
      >
        <For each={props.store.state.diffs}>
          {(diff) => (
            <button data-slot="file" onClick={() => props.onSelect(diff.file)}>
              <span data-slot="file-name">{diff.file}</span>
              <span data-slot="file-changes">
                <span data-slot="additions">+{diff.additions}</span>
                <span data-slot="deletions">-{diff.deletions}</span>
              </span>
            </button>
          )}
        </For>
      </Show>
    </div>
  )
}
