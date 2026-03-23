import { streamText } from "ai"

export async function* stream(opts: {
  model: Parameters<typeof streamText>[0]["model"]
  system: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
}): AsyncGenerator<string> {
  const res = streamText({
    model: opts.model,
    system: opts.system,
    messages: opts.messages,
  })
  for await (const chunk of res.textStream) {
    yield chunk
  }
}
