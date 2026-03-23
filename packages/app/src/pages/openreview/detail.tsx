import { Show } from "solid-js"
import type { ReviewFinding } from "./store"
import "./detail.css"

export function Detail(props: {
  finding: ReviewFinding
  onClose: () => void
  onNavigate: (file: string) => void
  onToggle: () => void
}) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      props.onClose()
    }
  }

  return (
    <div
      data-component="openreview-detail"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={(el) => el.focus()}
    >
      <div data-slot="header">
        <div data-slot="header-left">
          <span data-slot="type-badge" data-category={props.finding.category}>
            {props.finding.category === "bug" ? "Potential Bug" : "Flag"}
          </span>
          <span data-slot="line-badge">
            L{props.finding.start}
            <Show when={props.finding.end !== props.finding.start}>
              -{props.finding.end}
            </Show>
          </span>
        </div>
        <button data-slot="close" onClick={props.onClose}>
          &#10005;
        </button>
      </div>

      <div data-slot="body">
        <h3 data-slot="title">{props.finding.title}</h3>
        <p data-slot="description">{props.finding.description}</p>

        <button
          data-slot="file-link"
          onClick={() => props.onNavigate(props.finding.file)}
        >
          {props.finding.file}:{props.finding.start}
        </button>

        <Show when={props.finding.fix}>
          {(fix) => (
            <div data-slot="fix-section">
              <div data-slot="fix-header">Suggested fix</div>
              <pre data-slot="fix-code"><code>{fix().code}</code></pre>
              <p data-slot="fix-explanation">{fix().explanation}</p>
            </div>
          )}
        </Show>

        <div data-slot="actions">
          <button
            data-slot="resolve-btn"
            data-resolved={props.finding.resolved}
            onClick={props.onToggle}
          >
            {props.finding.resolved ? "Unresolve" : "Mark resolved"}
          </button>
          <span data-slot="confidence">
            {Math.round(props.finding.confidence * 100)}% confidence
          </span>
        </div>
      </div>
    </div>
  )
}
