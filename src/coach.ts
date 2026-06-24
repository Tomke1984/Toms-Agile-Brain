import type { BacklogItem, Entry, EntryType } from "./types";

const followUpRules = [
  {
    pattern: /\b(decid|decision|agreed|commit|committed)\b/i,
    task: "Confirm the decision, owner, and expected outcome in writing."
  },
  {
    pattern: /\b(block|blocked|stuck|risk|issue|concern|dependency)\b/i,
    task: "Identify the smallest unblocker and ask the right person for it."
  },
  {
    pattern: /\b(feedback|heard|said|mentioned|told)\b/i,
    task: "Turn the feedback into one behavior to try in the next interaction."
  },
  {
    pattern: /\b(question|unclear|unknown|wonder|ask|clarify)\b/i,
    task: "Clarify the open question before the next related conversation."
  },
  {
    pattern: /\b(meeting|sync|call|conversation|chat)\b/i,
    task: "Send a short recap with the next step and any owner."
  },
  {
    pattern: /\b(coach|coaching|mentor|learn|practice|retro)\b/i,
    task: "Choose one experiment to practice before the next coaching moment."
  }
];

const defaultFollowUps = [
  "Choose one follow-up you can complete in the next 48 hours.",
  "Name the next action, owner, and desired outcome.",
  "Capture what changed after the follow-up."
];

export function buildFollowUpSuggestions(notes: string, type: EntryType) {
  const trimmedNotes = notes.trim();
  if (trimmedNotes.length < 12) return [];

  const matchedTasks = followUpRules
    .filter((rule) => rule.pattern.test(trimmedNotes))
    .map((rule) => rule.task);

  const suggestions = [...matchedTasks, getTypeSpecificTask(type), ...defaultFollowUps];

  return Array.from(new Set(suggestions)).slice(0, 3);
}

export function createBacklogItemsForEntry(entry: Entry): BacklogItem[] {
  const createdAt = new Date().toISOString();
  const suggestions = buildFollowUpSuggestions(entry.notes, entry.type);
  const tasks = suggestions.length ? suggestions : [getTypeSpecificTask(entry.type), ...defaultFollowUps].slice(0, 3);

  return tasks.map((task) => ({
    id: crypto.randomUUID(),
    createdAt,
    entryId: entry.id,
    entryTitle: entry.title || "Untitled note",
    entryDate: entry.occurredAt,
    text: task,
    status: "open"
  }));
}

function getTypeSpecificTask(type: EntryType) {
  switch (type) {
    case "Meeting":
      return "Share action items with anyone who needs visibility.";
    case "Coaching":
      return "Pick one experiment to try before the next coaching moment.";
    case "Conversation":
      return "Follow up with the person while the conversation is still fresh.";
    case "Feedback":
      return "Decide what to keep, change, or clarify from this feedback.";
    case "Other":
      return "Name the smallest useful next step from this note.";
  }
}
