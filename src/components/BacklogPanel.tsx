import { ArrowLeft, ArrowRight, ListTodo, Trash2 } from "lucide-react";
import type { BacklogItem, BacklogStatus } from "../types";

const columns: Array<{ status: BacklogStatus; title: string }> = [
  { status: "todo", title: "To do" },
  { status: "doing", title: "Doing" },
  { status: "waiting", title: "Waiting" },
  { status: "done", title: "Done" }
];

type Props = {
  items: BacklogItem[];
  onMove: (id: string, status: BacklogStatus) => void;
  onDelete: (id: string) => void;
};

export default function BacklogPanel({ items, onMove, onDelete }: Props) {
  const openCount = items.filter((item) => item.status !== "done").length;

  return (
    <aside className="backlog-panel">
      <div className="panel-heading">
        <ListTodo size={20} />
        <h2>Action board</h2>
        <span className="count-pill">{openCount}</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state compact">Save a note and agile-coach follow-ups will appear here.</div>
      ) : (
        <div className="kanban-board" aria-label="Action Kanban board">
          {columns.map((column) => {
            const columnItems = items.filter((item) => item.status === column.status);

            return (
              <section className="kanban-column" key={column.status}>
                <div className="kanban-column-header">
                  <h3>{column.title}</h3>
                  <span>{columnItems.length}</span>
                </div>

                <div className="kanban-card-list">
                  {columnItems.length === 0 ? (
                    <p className="kanban-empty">Nothing here</p>
                  ) : (
                    columnItems.map((item) => (
                      <KanbanCard key={item.id} item={item} onMove={onMove} onDelete={onDelete} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </aside>
  );
}

function KanbanCard({ item, onMove, onDelete }: CardProps) {
  const columnIndex = columns.findIndex((column) => column.status === item.status);
  const previousStatus = columns[columnIndex - 1]?.status;
  const nextStatus = columns[columnIndex + 1]?.status;

  return (
    <article className={`kanban-card ${item.status === "done" ? "is-done" : ""}`}>
      <p>{item.text}</p>
      <small>
        {item.entryTitle} - {formatDate(item.entryDate)}
      </small>
      <div className="kanban-card-actions">
        <button
          className="icon-button"
          type="button"
          onClick={() => previousStatus && onMove(item.id, previousStatus)}
          disabled={!previousStatus}
          title="Move left"
          aria-label="Move left"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => nextStatus && onMove(item.id, nextStatus)}
          disabled={!nextStatus}
          title="Move right"
          aria-label="Move right"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="icon-button danger"
          type="button"
          onClick={() => onDelete(item.id)}
          title="Delete action"
          aria-label="Delete action"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

type CardProps = {
  item: BacklogItem;
  onMove: (id: string, status: BacklogStatus) => void;
  onDelete: (id: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}
