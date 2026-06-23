import { CheckSquare, Square, Trash2 } from "lucide-react";
import type { Entry } from "../types";

type Props = {
  entries: Entry[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function EntryList({ entries, selectedIds, onToggle, onDelete }: Props) {
  if (!entries.length) {
    return <div className="empty-state">No entries yet. Add the first quick note when something is fresh.</div>;
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => {
        const selected = selectedIds.has(entry.id);

        return (
          <article className={`entry-card ${selected ? "is-selected" : ""}`} key={entry.id}>
            <button
              className="select-button"
              type="button"
              onClick={() => onToggle(entry.id)}
              title={selected ? "Deselect entry" : "Select entry"}
              aria-label={selected ? "Deselect entry" : "Select entry"}
            >
              {selected ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <div className="entry-content">
              <div className="entry-meta">
                <time>{formatDate(entry.occurredAt)}</time>
                <span>{entry.type}</span>
              </div>
              <h3>{entry.title || "Untitled note"}</h3>
              <p>{entry.notes}</p>
            </div>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => onDelete(entry.id)}
              title="Delete entry"
              aria-label="Delete entry"
            >
              <Trash2 size={18} />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}
