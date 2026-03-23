import type { Config } from "../types/config"

export function model(cfg?: Config) {
  const provider = cfg?.provider ?? "anthropic"
  const key = cfg?.key

  if (provider === "anthropic") {
    const { createAnthropic } = require("@ai-sdk/anthropic") as typeof import("@ai-sdk/anthropic")
    const client = createAnthropic({
      apiKey: key ?? process.env.ANTHROPIC_API_KEY,
    })
    return client(cfg?.model ?? "claude-sonnet-4-20250514")
  }

  const { createOpenAI } = require("@ai-sdk/openai") as typeof import("@ai-sdk/openai")
  const client = createOpenAI({
    apiKey: key ?? process.env.OPENAI_API_KEY,
  })
  return client(cfg?.model ?? "gpt-4o")
}
