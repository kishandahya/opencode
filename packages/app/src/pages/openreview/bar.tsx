import { createSignal } from "solid-js"
import type { createChat } from "./use-chat"
import "./bar.css"

export function Bar(props: { chat: ReturnType<typeof createChat> }) {
  const [input, setInput] = createSignal("")

  function submit(e: Event) {
    e.preventDefault()
    const text = input().trim()
    if (!text) return
    if (props.chat.streaming()) return
    setInput("")
    props.chat.send(text)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  return (
    <div data-component="openreview-bar">
      <form data-slot="form" onSubmit={submit}>
        <input
          data-slot="input"
          type="text"
          placeholder="Ask anything about this PR..."
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={props.chat.streaming()}
        />
        <button
          data-slot="send"
          type="submit"
          disabled={!input().trim() || props.chat.streaming()}
        >
          Send
        </button>
      </form>
    </div>
  )
}
