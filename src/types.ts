export type EntryType = "Feedback" | "Meeting" | "Coaching" | "Conversation" | "Other";

export type Entry = {
  id: string;
  createdAt: string;
  occurredAt: string;
  type: EntryType;
  title: string;
  notes: string;
};

export type Insight = {
  id: string;
  createdAt: string;
  entryIds: string[];
  summary: string;
  patterns: string[];
  takeaways: string[];
  actions: string[];
  source: "local" | "ai";
};

export type BacklogItem = {
  id: string;
  createdAt: string;
  entryId: string;
  entryTitle: string;
  entryDate: string;
  text: string;
  status: "open" | "done";
  completedAt?: string;
};
