import { createSignal, type JSX } from "solid-js"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"
import "./layout.css"

export function ReviewLayout(props: { left: JSX.Element; center: JSX.Element; right: JSX.Element; bar: JSX.Element }) {
  const [left, setLeft] = createSignal(240)
  const [right, setRight] = createSignal(340)

  return (
    <div data-component="openreview-layout">
      <div data-slot="columns">
        <div data-slot="left" style={{ width: `${left()}px` }}>
          {props.left}
        </div>
        <ResizeHandle
          direction="horizontal"
          edge="start"
          size={left()}
          min={160}
          max={360}
          onResize={setLeft}
        />
        <div data-slot="center">
          {props.center}
        </div>
        <ResizeHandle
          direction="horizontal"
          edge="end"
          size={right()}
          min={280}
          max={480}
          onResize={setRight}
        />
        <div data-slot="right" style={{ width: `${right()}px` }}>
          {props.right}
        </div>
      </div>
      <div data-slot="bar">
        {props.bar}
      </div>
    </div>
  )
}
