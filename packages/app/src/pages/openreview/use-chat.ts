import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { ReviewAPI } from "./api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function createChat(id: string) {
  const [messages, setMessages] = createStore<ChatMessage[]>([])
  const [streaming, setStreaming] = createSignal(false)

  async function send(content: string) {
    setMessages((prev) => [...prev, { role: "user", content }])
    await ReviewAPI.chat(id, content)

    setStreaming(true)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    const source = new EventSource(ReviewAPI.chatStreamUrl(id))
    const idx = messages.length - 1

    source.addEventListener("text", (e) => {
      setMessages(idx, "content", (prev) => prev + e.data)
    })

    source.addEventListener("done", () => {
      source.close()
      setStreaming(false)
    })

    source.onerror = () => {
      source.close()
      setStreaming(false)
    }
  }

  return { messages, streaming, send }
}
