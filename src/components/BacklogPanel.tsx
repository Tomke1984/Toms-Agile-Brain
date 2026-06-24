import { CheckCircle2, Circle, ListTodo, Trash2 } from "lucide-react";
import type { BacklogItem } from "../types";

type Props = {
  items: BacklogItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function BacklogPanel({ items, onToggle, onDelete }: Props) {
  const openItems = items.filter((item) => item.status === "open");
  const doneItems = items.filter((item) => item.status === "done");

  return (
    <aside className="backlog-panel">
      <div className="panel-heading">
        <ListTodo size={20} />
        <h2>Action backlog</h2>
        <span className="count-pill">{openItems.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state compact">Save a note and agile-coach follow-ups will appear here.</div>
      ) : (
        <div className="backlog-list">
          {openItems.map((item) => (
            <BacklogCard key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
          ))}

          {doneItems.length > 0 && (
            <section className="done-backlog">
              <h3>Done</h3>
              {doneItems.slice(0, 5).map((item) => (
                <BacklogCard key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </section>
          )}
        </div>
      )}
    </aside>
  );
}

function BacklogCard({ item, onToggle, onDelete }: PropsForCard) {
  const isDone = item.status === "done";

  return (
    <article className={`backlog-card ${isDone ? "is-done" : ""}`}>
      <button
        className="select-button"
        type="button"
        onClick={() => onToggle(item.id)}
        title={isDone ? "Mark open" : "Mark done"}
        aria-label={isDone ? "Mark open" : "Mark done"}
      >
        {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      <div className="backlog-content">
        <p>{item.text}</p>
        <small>
          {item.entryTitle} - {formatDate(item.entryDate)}
        </small>
      </div>
      <button
        className="icon-button danger"
        type="button"
        onClick={() => onDelete(item.id)}
        title="Delete action"
        aria-label="Delete action"
      >
        <Trash2 size={17} />
      </button>
    </article>
  );
}

type PropsForCard = {
  item: BacklogItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}
