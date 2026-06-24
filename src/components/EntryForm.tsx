import { Check, ClipboardPenLine, Lightbulb, Mic, MicOff, Plus, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { buildFollowUpSuggestions } from "../coach";
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

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
    };
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function EntryForm({ onAdd }: Props) {
  const [type, setType] = useState<EntryType>("Feedback");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (saveState !== "saved") return;

    const timeoutId = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");

      if (transcript) {
        appendDictation(transcript);
      }
    };
    recognition.onerror = (event) => {
      setSpeechError(getSpeechErrorMessage(event.error));
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => recognition.abort();
  }, []);

  const canSave = Boolean(notes.trim());
  const suggestedFollowUps = useMemo(() => buildFollowUpSuggestions(notes, type), [notes, type]);

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

  function handleSuggestionClick(task: string) {
    setNotes((current) => {
      const separator = current.trim() ? "\n\n" : "";
      return `${current}${separator}Follow-up: ${task}`;
    });
    notesRef.current?.focus();
  }

  function handleNotesKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function appendDictation(transcript: string) {
    setNotes((current) => {
      const trimmedCurrent = current.trimEnd();
      const separator = trimmedCurrent ? " " : "";
      return `${trimmedCurrent}${separator}${transcript}`;
    });
    notesRef.current?.focus();
  }

  function toggleDictation() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    setSpeechError("");

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setSpeechError("Voice input is already starting. Try again in a moment.");
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

      <div className="notes-label-row">
        <label htmlFor="entry-notes">Notes</label>
        <button
          className={`voice-button ${isListening ? "is-listening" : ""}`}
          type="button"
          onClick={toggleDictation}
          disabled={!speechSupported}
          title={speechSupported ? "Toggle voice input" : "Voice input is not supported in this browser"}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? "Listening" : "Dictate"}
        </button>
      </div>
      <label className="notes-field" aria-label="Notes">
        <textarea
          id="entry-notes"
          ref={notesRef}
          placeholder="What happened? What was said? What should you remember?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onKeyDown={handleNotesKeyDown}
          rows={7}
        />
      </label>
      {(speechError || isListening) && (
        <p className={`voice-status ${speechError ? "is-error" : ""}`}>
          {speechError || "Speak naturally. Dictation will append final phrases to the note."}
        </p>
      )}

      {suggestedFollowUps.length > 0 && (
        <section className="follow-up-suggestions" aria-label="Suggested follow-up tasks">
          <div className="suggestion-heading">
            <Lightbulb size={16} />
            <h4>Suggested follow-ups</h4>
          </div>
          <div className="suggestion-row">
            {suggestedFollowUps.map((task) => (
              <button key={task} type="button" className="suggestion-chip" onClick={() => handleSuggestionClick(task)}>
                <Plus size={14} />
                {task}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="prompt-row" aria-label="Quick note prompts">
        {notePrompts.map((prompt) => (
          <button key={prompt} type="button" className="prompt-chip" onClick={() => handlePromptClick(prompt)}>
            <Plus size={14} />
            {prompt}
          </button>
        ))}
      </div>

      <div className="form-actions">
        <p className="save-hint">Ctrl/Cmd + Enter to save</p>
        <button className="primary-button" type="submit" disabled={!canSave} title="Save entry">
          {saveState === "saved" ? <Check size={18} /> : canSave ? <Save size={18} /> : <Plus size={18} />}
          {saveState === "saved" ? "Saved" : "Save entry"}
        </button>
      </div>
    </form>
  );
}

function getSpeechErrorMessage(error: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow microphone permission in the browser to use dictation.";
    case "no-speech":
      return "No speech was detected. Try again when you are ready.";
    case "audio-capture":
      return "No microphone was found. Check your input device and try again.";
    case "network":
      return "Voice recognition needs a working browser speech service. Check your connection and try again.";
    default:
      return "Voice input stopped unexpectedly. Try again.";
  }
}
