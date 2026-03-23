import { generateObject as gen } from "ai"
import type { ZodType } from "zod"

const RETRIES = 3
const BASE = 1000

export async function structured<T>(opts: {
  model: Parameters<typeof gen>[0]["model"]
  schema: ZodType<T>
  system: string
  prompt: string
}): Promise<{ result: T; usage: { input: number; output: number } }> {
  let attempt = 0
  while (true) {
    try {
      const res = await gen({
        model: opts.model,
        schema: opts.schema,
        system: opts.system,
        prompt: opts.prompt,
      })
      return {
        result: res.object,
        usage: {
          input: res.usage?.inputTokens ?? 0,
          output: res.usage?.outputTokens ?? 0,
        },
      }
    } catch (err: unknown) {
      attempt++
      if (attempt >= RETRIES) throw err
      const status = (err as { status?: number }).status
      if (status !== 429 && status !== 500 && status !== 503) throw err
      await new Promise((r) => setTimeout(r, BASE * Math.pow(2, attempt)))
    }
  }
}
