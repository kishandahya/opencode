import type { Config } from "../types/config"

export async function model(cfg?: Config) {
  const provider = cfg?.provider ?? "anthropic"
  const key = cfg?.key

  if (provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic")
    const client = createAnthropic({
      apiKey: key ?? process.env.ANTHROPIC_API_KEY,
    })
    return client(cfg?.model ?? "claude-sonnet-4-20250514")
  }

  const { createOpenAI } = await import("@ai-sdk/openai")
  const client = createOpenAI({
    apiKey: key ?? process.env.OPENAI_API_KEY,
  })
  return client(cfg?.model ?? "gpt-4o")
}
