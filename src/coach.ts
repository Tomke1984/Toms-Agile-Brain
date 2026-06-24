import type { BacklogItem, Entry, EntryType } from "./types";

const fallbackActions = [
  "Review this note and name the next concrete follow-up.",
  "Add an owner, due date, and desired outcome for the next action.",
  "Capture what changed after you follow up."
];

export function buildFollowUpSuggestions(notes: string, type: EntryType) {
  const sentences = getSentences(notes);
  if (sentences.join(" ").length < 12) return [];

  const actions = [
    ...extractExplicitActions(sentences),
    ...extractQuestions(sentences),
    ...extractBlockers(sentences),
    ...extractDecisions(sentences),
    ...extractFeedbackActions(sentences),
    ...extractNamedPersonActions(sentences),
    getTypeSpecificAction(type, sentences)
  ];

  const usefulActions = actions.filter(Boolean).map(polishAction);
  const uniqueActions = Array.from(new Set(usefulActions));

  return uniqueActions.slice(0, 4);
}

export function createBacklogItemsForEntry(entry: Entry): BacklogItem[] {
  const createdAt = new Date().toISOString();
  const suggestions = buildFollowUpSuggestions(entry.notes, entry.type);
  const tasks = suggestions.length ? suggestions : fallbackActions;

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

function extractExplicitActions(sentences: string[]) {
  return sentences.flatMap((sentence) => {
    const normalized = stripLeadIn(sentence);
    const lower = normalized.toLowerCase();

    if (/\b(follow[- ]?up|todo|to do|action item|next step)\b/.test(lower)) {
      return [`Do this follow-up: ${removeActionLabel(normalized)}`];
    }

    if (/\b(i|we)\s+(need to|should|must|will|have to|agreed to|committed to)\b/.test(lower)) {
      return [`Complete the commitment: ${normalized}`];
    }

    if (/\b(can you|could you|please|ask me to|asked me to)\b/.test(lower)) {
      return [`Respond to the request: ${normalized}`];
    }

    return [];
  });
}

function extractQuestions(sentences: string[]) {
  return sentences
    .filter((sentence) => sentence.includes("?") || /\b(question|unclear|not clear|clarify|unknown|unsure)\b/i.test(sentence))
    .map((sentence) => `Clarify this question: ${trimSentence(sentence)}`);
}

function extractBlockers(sentences: string[]) {
  return sentences
    .filter((sentence) => /\b(blocked|stuck|blocking|risk|issue|concern|dependency|waiting for|missing)\b/i.test(sentence))
    .map((sentence) => {
      const person = findPerson(sentence);
      const target = person ? ` with ${person}` : "";
      return `Unblock this${target}: ${trimSentence(sentence)}`;
    });
}

function extractDecisions(sentences: string[]) {
  return sentences
    .filter((sentence) => /\b(decided|decision|agreed|aligned|committed|approved)\b/i.test(sentence))
    .map((sentence) => `Document and confirm this decision: ${trimSentence(sentence)}`);
}

function extractFeedbackActions(sentences: string[]) {
  return sentences
    .filter((sentence) => /\b(feedback|said|mentioned|told me|heard|suggested|asked)\b/i.test(sentence))
    .map((sentence) => {
      const person = findPerson(sentence);
      const target = person ? ` with ${person}` : "";
      return `Turn this feedback into one behavior to try${target}: ${trimSentence(sentence)}`;
    });
}

function extractNamedPersonActions(sentences: string[]) {
  return sentences.flatMap((sentence) => {
    const person = findPerson(sentence);
    if (!person) return [];

    if (/\b(waiting for|needs?|owns?|owner|will|should|promised|send|share|review)\b/i.test(sentence)) {
      return [`Follow up with ${person}: ${trimSentence(sentence)}`];
    }

    return [];
  });
}

function getTypeSpecificAction(type: EntryType, sentences: string[]) {
  const strongestSentence = sentences.find((sentence) =>
    /\b(decided|agreed|blocked|question|feedback|asked|should|need to|will)\b/i.test(sentence)
  );

  if (!strongestSentence) return "";

  switch (type) {
    case "Meeting":
      return `Send a recap that includes this: ${trimSentence(strongestSentence)}`;
    case "Coaching":
      return `Define one coaching experiment from this: ${trimSentence(strongestSentence)}`;
    case "Conversation":
      return `Follow up while this is fresh: ${trimSentence(strongestSentence)}`;
    case "Feedback":
      return `Choose what to keep, change, or clarify from this feedback: ${trimSentence(strongestSentence)}`;
    case "Other":
      return `Create the smallest next step from this: ${trimSentence(strongestSentence)}`;
  }
}

function getSentences(notes: string) {
  return notes
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => sentence.length > 4);
}

function findPerson(sentence: string) {
  const match =
    sentence.match(/\b(?:with|from|to|for|by|ask|asked|told|said|mentioned)\s+([A-Z][a-z]+)\b/) ??
    sentence.match(/\b([A-Z][a-z]+)\s+(?:said|mentioned|asked|told|needs?|owns?|will|should|promised)\b/);

  return match?.[1];
}

function stripLeadIn(sentence: string) {
  return sentence.replace(/^\s*[-*]?\s*/, "").trim();
}

function removeActionLabel(sentence: string) {
  return sentence.replace(/^(follow[- ]?up|todo|to do|action item|next step)\s*:\s*/i, "").trim();
}

function trimSentence(sentence: string) {
  const cleaned = stripLeadIn(sentence).replace(/\s+/g, " ").trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

function polishAction(action: string) {
  const cleaned = action.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.endsWith(".") || cleaned.endsWith("?") ? cleaned : `${cleaned}.`;
}
