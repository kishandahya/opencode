import { createSignal, Show } from "solid-js"
import type { ReviewStore } from "./store"
import type { createChat } from "./use-chat"
import { Info } from "./info"
import { Chat } from "./chat"
import "./sidebar.css"

export function Sidebar(props: {
  store: ReviewStore
  chat: ReturnType<typeof createChat>
  onNavigate: (file: string) => void
}) {
  const [tab, setTab] = createSignal<"info" | "chat">("info")

  return (
    <div data-component="openreview-sidebar">
      <div data-slot="tabs">
        <button
          data-slot="tab"
          data-active={tab() === "info"}
          onClick={() => setTab("info")}
        >
          Info
        </button>
        <button
          data-slot="tab"
          data-active={tab() === "chat"}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>
      </div>
      <div data-slot="content">
        <Show when={tab() === "info"}>
          <Info store={props.store} onNavigate={props.onNavigate} />
        </Show>
        <Show when={tab() === "chat"}>
          <Chat chat={props.chat} />
        </Show>
      </div>
    </div>
  )
}
