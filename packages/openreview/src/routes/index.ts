import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import z from "zod"
import * as Pipeline from "../pipeline"
import { Config } from "../types/config"
import { model } from "../llm/provider"
import { stream } from "../llm/stream"
import type { Review } from "../types/review"

const ChatBody = z.object({
  content: z.string().min(1).max(10000),
})

export function OpenReviewRoutes(): Hono {
  const app = new Hono()

  // Start a review
  app.post("/", async (c) => {
    const body = await c.req.json<{ url: string; config?: Record<string, unknown> }>()
    if (!body.url) return c.json({ error: "url is required" }, 400)

    const parsed = Config.safeParse(body.config ?? {})
    if (!parsed.success) return c.json({ error: "Invalid config", details: parsed.error.issues }, 400)
    const id = await Pipeline.run(body.url, parsed.data)
    return c.json({ id })
  })

  // Get session state
  app.get("/:id", (c) => {
    const review = Pipeline.get(c.req.param("id"))
    if (!review) return c.json({ error: "not found" }, 404)
    return c.json(review)
  })

  // SSE stream for pipeline events
  app.get("/:id/stream", (c) => {
    const sid = c.req.param("id")
    const review = Pipeline.get(sid)
    if (!review) return c.json({ error: "not found" }, 404)

    return streamSSE(c, async (sse) => {
      let resolve: (() => void) | undefined
      const completed = new Promise<void>((r) => { resolve = r })

      const unsub = Pipeline.subscribe(sid, (e) => {
        sse.writeSSE({ event: e.type, data: JSON.stringify(e) }).catch(() => {})
        if (e.type === "done" || e.type === "error") resolve?.()
      })

      // If already done, send current state and clean up
      if (review.status === "done") {
        unsub()
        await sse.writeSSE({ event: "done", data: JSON.stringify({ type: "done" }) })
        return
      }
      if (review.status === "error") {
        unsub()
        await sse.writeSSE({
          event: "error",
          data: JSON.stringify({ type: "error", message: "Review failed" }),
        })
        return
      }

      // Heartbeat
      const timer = setInterval(() => {
        sse.writeSSE({ event: "heartbeat", data: "{}" }).catch(() => {})
      }, 10000)

      // Wait for completion (event-driven, no polling)
      await completed

      clearInterval(timer)
      unsub()
    })
  })

  // Send chat message
  app.post("/:id/chat", async (c) => {
    const review = Pipeline.get(c.req.param("id"))
    if (!review) return c.json({ error: "not found" }, 404)

    const raw = await c.req.json()
    const result = ChatBody.safeParse(raw)
    if (!result.success) return c.json({ error: "Invalid chat body", details: result.error.issues }, 400)
    review.messages.push({
      role: "user",
      content: result.data.content,
      timestamp: Date.now(),
    })
    return c.json({ ok: true })
  })

  // SSE stream for chat response
  app.get("/:id/chat/stream", (c) => {
    const review = Pipeline.get(c.req.param("id"))
    if (!review) return c.json({ error: "not found" }, 404)

    return streamSSE(c, async (sse) => {
      const system = buildChatSystem(review)
      const msgs = review.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

      let full = ""
      const llm = await model(review.config)
      const gen = stream({
        model: llm,
        system,
        messages: msgs,
      })

      for await (const chunk of gen) {
        full += chunk
        await sse.writeSSE({ event: "text", data: chunk })
      }

      review.messages.push({
        role: "assistant",
        content: full,
        timestamp: Date.now(),
      })

      await sse.writeSSE({ event: "done", data: "{}" })
    })
  })

  // Toggle finding resolved
  app.patch("/:id/findings/:fid", async (c) => {
    const review = Pipeline.get(c.req.param("id"))
    if (!review) return c.json({ error: "not found" }, 404)

    const fid = c.req.param("fid")
    const body = await c.req.json<{ resolved: boolean }>()
    const finding = review.findings.find((f) => f.id === fid)
    if (!finding) return c.json({ error: "finding not found" }, 404)

    finding.resolved = body.resolved
    return c.json({ ok: true })
  })

  // Export
  app.get("/:id/export", (c) => {
    const review = Pipeline.get(c.req.param("id"))
    if (!review) return c.json({ error: "not found" }, 404)

    const format = c.req.query("format") ?? "json"
    if (format === "md") {
      const md = exportMarkdown(review)
      return c.text(md, 200, { "Content-Type": "text/markdown" })
    }
    return c.json(review)
  })

  return app
}

function buildChatSystem(review: Review): string {
  const parts = [
    `You are an AI code review assistant. You have reviewed PR "${review.pr?.title ?? review.url}".`,
    review.summary ? `Summary: ${review.summary.text}` : "",
    review.findings.length > 0
      ? `Findings:\n${review.findings.map((f) => `- [${f.severity}] ${f.title} in ${f.file}:${f.start}`).join("\n")}`
      : "No issues found.",
    "Answer questions about this PR concisely and helpfully.",
  ]
  return parts.filter(Boolean).join("\n\n")
}

function exportMarkdown(review: Review): string {
  const lines = [
    `# Code Review: ${review.pr?.title ?? review.url}`,
    "",
    `**Status**: ${review.status}`,
    `**Verdict**: ${review.summary?.verdict ?? "pending"}`,
    "",
    review.summary?.text ?? "",
    "",
    "## Findings",
    "",
  ]

  for (const f of review.findings) {
    lines.push(`### ${f.title}`)
    lines.push(`- **Severity**: ${f.severity}`)
    lines.push(`- **File**: ${f.file}:${f.start}-${f.end}`)
    lines.push(`- **Confidence**: ${(f.confidence * 100).toFixed(0)}%`)
    lines.push("")
    lines.push(f.description)
    if (f.fix) {
      lines.push("")
      lines.push("**Suggested fix:**")
      lines.push("```")
      lines.push(f.fix.code)
      lines.push("```")
      lines.push(f.fix.explanation)
    }
    lines.push("")
  }

  return lines.join("\n")
}
