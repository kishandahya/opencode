export namespace ReviewAPI {
  export async function start(url: string, config?: Record<string, unknown>) {
    const res = await fetch("/openreview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, config }),
    })
    return res.json() as Promise<{ id: string }>
  }

  export async function get(id: string) {
    const res = await fetch(`/openreview/${id}`)
    return res.json()
  }

  export async function toggle(id: string, fid: string, resolved: boolean) {
    const res = await fetch(`/openreview/${id}/findings/${fid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    })
    return res.json()
  }

  export async function chat(id: string, content: string) {
    const res = await fetch(`/openreview/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    return res.json()
  }

  export function streamUrl(id: string) {
    return `/openreview/${id}/stream`
  }

  export function chatStreamUrl(id: string) {
    return `/openreview/${id}/chat/stream`
  }

  export function exportUrl(id: string, format: "json" | "md") {
    return `/openreview/${id}/export?format=${format}`
  }
}
