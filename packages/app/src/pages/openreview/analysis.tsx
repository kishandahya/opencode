import { createSignal, For, Show } from "solid-js"
import type { ReviewStore } from "./store"
import "./analysis.css"

export function Analysis(props: { store: ReviewStore }) {
  const [open, setOpen] = createSignal(true)

  const done = () => props.store.state.status === "done"
  const running = () => props.store.state.status === "running"
  const summary = () => props.store.state.summary

  return (
    <div data-component="openreview-analysis">
      <button data-slot="toggle" onClick={() => setOpen((v) => !v)}>
        <span data-slot="icon" data-open={open()}>
          &#9654;
        </span>
        <span data-slot="label">OpenReview's AI analysis</span>
        <Show when={running()}>
          <span data-slot="status">Running...</span>
        </Show>
        <Show when={done()}>
          <span data-slot="status" data-done>
            Complete
          </span>
        </Show>
      </button>
      <Show when={open()}>
        <div data-slot="body">
          <Show when={summary()}>
            {(s) => (
              <div data-slot="summary">
                <div data-slot="verdict" data-verdict={s().verdict}>
                  {s().verdict === "pass" ? "PASS" : "FAIL"} — {Math.round(s().confidence * 100)}% confidence
                </div>
                <p data-slot="text">{s().text}</p>
                <div data-slot="counts">
                  <Show when={s().counts.severe > 0}>
                    <span data-slot="count" data-severity="severe">
                      {s().counts.severe} severe
                    </span>
                  </Show>
                  <Show when={s().counts.nonSevere > 0}>
                    <span data-slot="count" data-severity="non-severe">
                      {s().counts.nonSevere} non-severe
                    </span>
                  </Show>
                  <Show when={s().counts.investigate > 0}>
                    <span data-slot="count" data-severity="investigate">
                      {s().counts.investigate} investigate
                    </span>
                  </Show>
                  <Show when={s().counts.informational > 0}>
                    <span data-slot="count" data-severity="informational">
                      {s().counts.informational} informational
                    </span>
                  </Show>
                  <Show when={s().counts.flags > 0}>
                    <span data-slot="count" data-severity="flag">
                      {s().counts.flags} flags
                    </span>
                  </Show>
                </div>
              </div>
            )}
          </Show>
          <div data-slot="log">
            <For each={props.store.state.progress}>
              {(msg) => <div data-slot="log-entry">{msg}</div>}
            </For>
            <Show when={running()}>
              <div data-slot="log-entry" data-active>
                <span data-slot="spinner" />
                Analyzing...
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
