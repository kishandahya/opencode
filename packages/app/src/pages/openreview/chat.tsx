import { For, Show } from "solid-js"
import type { createChat } from "./use-chat"
import "./chat.css"

const PROMPTS = [
  "Fix the bugs found",
  "Summarize the changes",
  "Explain the architecture",
]

export function Chat(props: { chat: ReturnType<typeof createChat> }) {
  const empty = () => props.chat.messages.length === 0

  return (
    <div data-component="openreview-chat">
      <div data-slot="messages">
        <Show when={empty()}>
          <div data-slot="greeting">
            <div data-slot="greeting-title">OpenReview Chat</div>
            <p data-slot="greeting-text">
              I've reviewed this PR and I'm ready to help. Ask me anything about the
              code changes, findings, or architecture.
            </p>
            <div data-slot="prompts">
              <For each={PROMPTS}>
                {(prompt) => (
                  <button
                    data-slot="prompt"
                    onClick={() => props.chat.send(prompt)}
                  >
                    {prompt}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>
        <For each={props.chat.messages}>
          {(msg) => (
            <div data-slot="message" data-role={msg.role}>
              <div data-slot="message-role">
                {msg.role === "user" ? "You" : "OpenReview"}
              </div>
              <div data-slot="message-content">{msg.content}</div>
            </div>
          )}
        </For>
        <Show when={props.chat.streaming()}>
          <div data-slot="typing">
            <span data-slot="typing-dot" />
            <span data-slot="typing-dot" />
            <span data-slot="typing-dot" />
          </div>
        </Show>
      </div>
    </div>
  )
}
