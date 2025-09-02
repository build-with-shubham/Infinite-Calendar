import { JournalEntry } from "@/types/events";

const STORAGE_KEY = "journal_entries";

export function saveEntries(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function loadEntries(): JournalEntry[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
