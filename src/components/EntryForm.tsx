import { Check, ClipboardPenLine, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Entry, EntryType } from "../types";

const entryTypes: EntryType[] = ["Feedback", "Meeting", "Coaching", "Conversation", "Other"];

const notePrompts = [
  "Feedback I heard",
  "Decision to remember",
  "Follow-up for me",
  "Question to revisit"
];

type Props = {
  onAdd: (entry: Entry) => void;
};

export default function EntryForm({ onAdd }: Props) {
  const [type, setType] = useState<EntryType>("Feedback");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (saveState !== "saved") return;

    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  const canSave = Boolean(notes.trim());

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    onAdd({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      occurredAt,
      type,
      title: title.trim(),
      notes: notes.trim()
    });

    setTitle("");
    setNotes("");
    setType("Feedback");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setSaveState("saved");
    notesRef.current?.focus();
  }

  function handlePromptClick(prompt: string) {
    setNotes((current) => {
      const separator = current.trim() ? "\n\n" : "";
      return `${current}${separator}${prompt}: `;
    });
    notesRef.current?.focus();
  }

  function handleNotesKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="quick-note-header">
        <div className="quick-note-icon" aria-hidden="true">
          <ClipboardPenLine size={20} />
        </div>
        <div>
          <h3>Quick note</h3>
          <p>Capture the raw moment now. Shape it later when you review.</p>
        </div>
      </div>

      <div className="form-row">
        <label>
          Date
          <input type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
        </label>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value as EntryType)}>
            {entryTypes.map((entryType) => (
              <option key={entryType}>{entryType}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Short title
        <input
          type="text"
          placeholder="Optional, useful for scanning later"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label>
        Notes
        <textarea
          ref={notesRef}
          placeholder="What happened? What was said? What should you remember?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onKeyDown={handleNotesKeyDown}
          rows={7}
        />
      </label>

      <div className="prompt-row" aria-label="Quick note prompts">
        {notePrompts.map((prompt) => (
          <button key={prompt} type="button" className="prompt-chip" onClick={() => handlePromptClick(prompt)}>
            <Plus size={14} />
            {prompt}
          </button>
        ))}
      </div>

      <div className="form-actions">
        <p className="save-hint">Ctrl/⌘ + Enter to save</p>
        <button className="primary-button" type="submit" disabled={!canSave} title="Save entry">
          {saveState === "saved" ? <Check size={18} /> : canSave ? <Save size={18} /> : <Plus size={18} />}
          {saveState === "saved" ? "Saved" : "Save entry"}
        </button>
      </div>
    </form>
  );
}
