import type { EventEntry, JournalEntry } from "@/types/events"

const LOCAL_KEY = "infinite-calendar-local-events-v1"

export async function fetchRemoteJournal(): Promise<JournalEntry[]> {
  try {
    const res = await fetch("/journal.json", { cache: "no-store" })
    if (!res.ok) throw new Error("No JSON available at /journal.json")
    const raw = await res.json()
    const withIds: JournalEntry[] = (raw as any[]).map((e, i) => ({
      id: e.id || `remote-${i}-${e.date}`,
      date: e.date,
      imageUrl: e.imageUrl,
      rating: typeof e.rating === "number" ? e.rating : undefined,
      categories: Array.isArray(e.categories) ? e.categories : [],
      description: e.description || "",
      source: "remote",
    }))
    return withIds
  } catch (e) {
    console.warn("Remote journal fetch failed. Provide /journal.json in production.", e)
    return []
  }
}

export function loadLocalEvents(): EventEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EventEntry[]
    return parsed.map((e) => ({ ...e, source: "local" }))
  } catch {
    return []
  }
}

export function saveLocalEvents(events: EventEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(events.filter((e) => e.source === "local")))
}
