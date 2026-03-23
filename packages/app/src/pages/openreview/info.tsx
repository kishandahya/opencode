import { createSignal, For, Show, type JSX } from "solid-js"
import type { ReviewStore, ReviewFinding } from "./store"
import { Detail } from "./detail"
import "./info.css"

export function Info(props: { store: ReviewStore; onNavigate: (file: string) => void }) {
  const [selected, setSelected] = createSignal<ReviewFinding | undefined>()

  const bugs = () => props.store.state.findings.filter((f) => f.category === "bug")
  const flags = () => props.store.state.findings.filter((f) => f.category === "flag")
  const severe = () => bugs().filter((f) => f.severity === "severe")
  const other = () => bugs().filter((f) => f.severity !== "severe")

  const summary = () => props.store.state.summary
  const pr = () => props.store.state.pr

  function handleClick(finding: ReviewFinding) {
    setSelected(finding)
    props.onNavigate(finding.file)
  }

  return (
    <div data-component="openreview-info">
      <Show when={selected()}>
        {(f) => (
          <Detail
            finding={f()}
            onClose={() => setSelected(undefined)}
            onNavigate={props.onNavigate}
            onToggle={() => props.store.toggleResolved(f().id)}
          />
        )}
      </Show>

      <Show when={summary()}>
        {(s) => (
          <div data-slot="verdict-section">
            <div data-slot="verdict" data-result={s().verdict}>
              {s().verdict === "pass" ? "PASS" : "FAIL"}
            </div>
            <span data-slot="verdict-text">
              {Math.round(s().confidence * 100)}% confidence
            </span>
          </div>
        )}
      </Show>

      <Show when={bugs().length > 0}>
        <Section
          title={`${bugs().length} Potential bug${bugs().length !== 1 ? "s" : ""}`}
          severity="bug"
          defaultOpen
        >
          <Show when={severe().length > 0}>
            <div data-slot="subsection">
              <div data-slot="subsection-title">Severe ({severe().length})</div>
              <For each={severe()}>
                {(finding) => (
                  <FindingCard finding={finding} onClick={() => handleClick(finding)} />
                )}
              </For>
            </div>
          </Show>
          <Show when={other().length > 0}>
            <div data-slot="subsection">
              <div data-slot="subsection-title">Other ({other().length})</div>
              <For each={other()}>
                {(finding) => (
                  <FindingCard finding={finding} onClick={() => handleClick(finding)} />
                )}
              </For>
            </div>
          </Show>
        </Section>
      </Show>

      <Show when={flags().length > 0}>
        <Section
          title={`${flags().length} Flag${flags().length !== 1 ? "s" : ""}`}
          severity="flag"
        >
          <For each={flags()}>
            {(finding) => (
              <FindingCard finding={finding} onClick={() => handleClick(finding)} />
            )}
          </For>
        </Section>
      </Show>

      <Show when={pr()}>
        {(p) => (
          <>
            <Show when={p().checks}>
              {(checks) => (
                <Section title="Checks" severity="check">
                  <div data-slot="checks">
                    <div data-slot="check-bar">
                      <div
                        data-slot="check-passed"
                        style={{ width: `${checks().total > 0 ? (checks().passed / checks().total) * 100 : 0}%` }}
                      />
                    </div>
                    <span data-slot="check-text">
                      {checks().passed}/{checks().total} passed
                    </span>
                  </div>
                </Section>
              )}
            </Show>

            <Show when={p().reviewers.length > 0}>
              <Section title="Reviewers" severity="meta">
                <div data-slot="meta-list">
                  <For each={p().reviewers}>
                    {(reviewer) => <span data-slot="meta-item">{reviewer}</span>}
                  </For>
                </div>
              </Section>
            </Show>

            <Show when={p().labels.length > 0}>
              <Section title="Labels" severity="meta">
                <div data-slot="meta-list">
                  <For each={p().labels}>
                    {(label) => <span data-slot="label">{label}</span>}
                  </For>
                </div>
              </Section>
            </Show>
          </>
        )}
      </Show>

      <Show
        when={
          props.store.state.status === "running" &&
          bugs().length === 0 &&
          flags().length === 0
        }
      >
        <div data-slot="loading">
          <span data-slot="spinner" />
          Analyzing PR...
        </div>
      </Show>
    </div>
  )
}

function Section(props: {
  title: string
  severity: string
  defaultOpen?: boolean
  children: JSX.Element
}) {
  const [open, setOpen] = createSignal(props.defaultOpen ?? false)

  return (
    <div data-slot="section" data-severity={props.severity}>
      <button data-slot="section-header" onClick={() => setOpen((v) => !v)}>
        <span data-slot="section-chevron" data-open={open()}>
          &#9654;
        </span>
        <span data-slot="section-title">{props.title}</span>
      </button>
      <Show when={open()}>
        <div data-slot="section-body">{props.children}</div>
      </Show>
    </div>
  )
}

function FindingCard(props: { finding: ReviewFinding; onClick: () => void }) {
  return (
    <button
      data-slot="finding-card"
      data-resolved={props.finding.resolved}
      onClick={props.onClick}
    >
      <div data-slot="finding-top">
        <span data-slot="finding-icon" data-severity={props.finding.severity}>
          &#9679;
        </span>
        <span data-slot="finding-title">{props.finding.title}</span>
      </div>
      <div data-slot="finding-meta">
        <span data-slot="finding-badge" data-severity={props.finding.severity}>
          {props.finding.severity}
        </span>
        <span data-slot="finding-location">
          {props.finding.file.split("/").pop()}:{props.finding.start}
        </span>
      </div>
    </button>
  )
}
