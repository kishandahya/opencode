import { Show } from "solid-js"
import type { ReviewStore } from "./store"
import "./header.css"

export function Header(props: { store: ReviewStore }) {
  const pr = () => props.store.state.pr
  const total = () =>
    props.store.state.diffs.reduce((sum, d) => sum + d.additions + d.deletions, 0)
  const additions = () => props.store.state.diffs.reduce((sum, d) => sum + d.additions, 0)
  const deletions = () => props.store.state.diffs.reduce((sum, d) => sum + d.deletions, 0)

  return (
    <div data-component="openreview-header">
      <Show when={pr()}>
        {(p) => (
          <>
            <div data-slot="top">
              <span
                data-slot="badge"
                data-status={p().status}
              >
                {p().status}
              </span>
              <span data-slot="repo">
                {p().owner}/{p().repo} #{p().number}
              </span>
            </div>
            <div data-slot="title">{p().title}</div>
            <div data-slot="meta">
              <span data-slot="branch">
                {p().head} → {p().base}
              </span>
              <span data-slot="stats">
                {props.store.state.diffs.length} files
                <span data-slot="additions">+{additions()}</span>
                <span data-slot="deletions">-{deletions()}</span>
              </span>
            </div>
          </>
        )}
      </Show>
      <Show when={!pr()}>
        <div data-slot="loading">Loading PR data...</div>
      </Show>
    </div>
  )
}
