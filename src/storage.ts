import type { BacklogItem, Entry, Insight } from "./types";

const entriesKey = "agile-brain.entries.v1";
const insightsKey = "agile-brain.insights.v1";
const backlogKey = "agile-brain.backlog.v1";

type StoredBacklogItem = Omit<BacklogItem, "status"> & {
  status: BacklogItem["status"] | "open";
};

function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadEntries(): Entry[] {
  return readJson<Entry[]>(entriesKey, []);
}

export function saveEntries(entries: Entry[]) {
  writeJson(entriesKey, entries);
}

export function loadInsights(): Insight[] {
  return readJson<Insight[]>(insightsKey, []);
}

export function saveInsights(insights: Insight[]) {
  writeJson(insightsKey, insights);
}

export function loadBacklogItems(): BacklogItem[] {
  return readJson<StoredBacklogItem[]>(backlogKey, []).map((item) => ({
    ...item,
    status: item.status === "open" ? "todo" : item.status
  }));
}

export function saveBacklogItems(items: BacklogItem[]) {
  writeJson(backlogKey, items);
}
