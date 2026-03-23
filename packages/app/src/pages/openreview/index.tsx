import { createSignal, Show } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { ReviewLayout } from "./layout"
import { createReviewStore } from "./store"
import { createReviewStream } from "./stream"
import { createChat } from "./use-chat"
import { ReviewAPI } from "./api"
import { Nav } from "./nav"
import { Header } from "./header"
import { Analysis } from "./analysis"
import { Diffs } from "./diffs"
import { Sidebar } from "./sidebar"
import { Bar } from "./bar"
import "./layout.css"

function StartPage() {
  const [url, setUrl] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const navigate = useNavigate()

  async function submit(e: Event) {
    e.preventDefault()
    if (!url()) return
    setLoading(true)
    try {
      const res = await ReviewAPI.start(url())
      navigate(`/review/${res.id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div data-component="openreview-start">
      <div data-slot="title">OpenReview</div>
      <div data-slot="subtitle">AI-powered code review for GitHub pull requests</div>
      <form data-slot="form" onSubmit={submit}>
        <input
          data-slot="input"
          type="text"
          placeholder="Paste a GitHub PR URL..."
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
        />
        <button data-slot="submit" type="submit" disabled={loading()}>
          {loading() ? "Starting..." : "Start Review"}
        </button>
      </form>
    </div>
  )
}

function ReviewPage() {
  const params = useParams<{ id: string }>()
  const store = createReviewStore()
  const chat = createChat(params.id)
  const [focused, setFocused] = createSignal<string | undefined>()

  createReviewStream(params.id, store)

  function scrollTo(file: string) {
    setFocused(file)
  }

  return (
    <ReviewLayout
      left={<Nav store={store} onSelect={scrollTo} />}
      center={
        <>
          <Header store={store} />
          <Analysis store={store} />
          <Diffs store={store} focused={focused()} />
        </>
      }
      right={<Sidebar store={store} chat={chat} onNavigate={scrollTo} />}
      bar={<Bar chat={chat} />}
    />
  )
}

export default function OpenReviewPage() {
  const params = useParams<{ id?: string }>()

  return (
    <Show when={params.id} fallback={<StartPage />}>
      <ReviewPage />
    </Show>
  )
}
