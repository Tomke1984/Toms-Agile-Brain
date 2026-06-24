import { useEffect, useMemo, useState } from "react";
import BacklogPanel from "./components/BacklogPanel";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import InsightPanel from "./components/InsightPanel";
import { generateInsight } from "./ai";
import { createBacklogItemsForEntry } from "./coach";
import { loadBacklogItems, loadEntries, loadInsights, saveBacklogItems, saveEntries, saveInsights } from "./storage";
import type { BacklogItem, BacklogStatus, Entry, Insight } from "./types";

type AppPage = "notes" | "followup";

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [insights, setInsights] = useState<Insight[]>(() => loadInsights());
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>(() => loadBacklogItems());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<AppPage>("notes");

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => saveInsights(insights), [insights]);
  useEffect(() => saveBacklogItems(backlogItems), [backlogItems]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return entries;

    return entries.filter((entry) =>
      [entry.title, entry.notes, entry.type, entry.occurredAt].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [entries, query]);

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.has(entry.id)),
    [entries, selectedIds]
  );

  function addEntry(entry: Entry) {
    setEntries((current) => [entry, ...current]);
    setBacklogItems((current) => [...createBacklogItemsForEntry(entry), ...current]);
  }

  function toggleEntry(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function deleteEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setBacklogItems((current) => current.filter((item) => item.entryId !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function moveBacklogItem(id: string, status: BacklogStatus) {
    setBacklogItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              completedAt: status === "done" ? item.completedAt ?? new Date().toISOString() : undefined
            }
          : item
      )
    );
  }

  function deleteBacklogItem(id: string) {
    setBacklogItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleGenerateInsight() {
    if (!selectedEntries.length) return;

    setIsGenerating(true);
    try {
      const insight = await generateInsight(selectedEntries);
      setCurrentInsight(insight);
      setInsights((current) => [insight, ...current]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="top-bar">
          <div className="brand-block">
            <p className="eyebrow">Personal notes</p>
            <h1>Tom's Agile Brain</h1>
            <nav className="page-tabs" aria-label="Main views">
              <button
                className={page === "notes" ? "is-active" : ""}
                type="button"
                onClick={() => setPage("notes")}
              >
                Notes
              </button>
              <button
                className={page === "followup" ? "is-active" : ""}
                type="button"
                onClick={() => setPage("followup")}
              >
                Actions
              </button>
            </nav>
          </div>
          <div className="top-controls">
            {page === "notes" && (
              <input
                className="search"
                type="search"
                placeholder="Search notes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            )}
          </div>
        </header>

        {page === "notes" ? (
          <div className="notes-grid">
            <section className="log-panel">
              <div className="section-heading">
                <h2>Log a moment</h2>
                <span>{entries.length} saved</span>
              </div>
              <EntryForm onAdd={addEntry} />
            </section>

            <section className="review-panel">
              <div className="section-heading">
                <h2>Review notes</h2>
                <span>{selectedIds.size} selected</span>
              </div>
              <EntryList
                entries={filteredEntries}
                selectedIds={selectedIds}
                onToggle={toggleEntry}
                onDelete={deleteEntry}
              />
            </section>

            <InsightPanel
              currentInsight={currentInsight}
              savedInsights={insights}
              selectedCount={selectedEntries.length}
              isGenerating={isGenerating}
              onGenerate={handleGenerateInsight}
            />
          </div>
        ) : (
          <div className="followup-grid">
            <BacklogPanel items={backlogItems} onMove={moveBacklogItem} onDelete={deleteBacklogItem} />
          </div>
        )}
      </section>
    </main>
  );
}
