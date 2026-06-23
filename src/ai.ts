import type { Entry, Insight } from "./types";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

function compactEntry(entry: Entry) {
  return [
    `Date: ${entry.occurredAt}`,
    `Type: ${entry.type}`,
    `Title: ${entry.title || "Untitled"}`,
    `Notes: ${entry.notes}`
  ].join("\n");
}

function localInsight(entries: Entry[]): Omit<Insight, "id" | "createdAt" | "entryIds"> {
  const types = Array.from(new Set(entries.map((entry) => entry.type))).join(", ");
  const combinedNotes = entries.map((entry) => entry.notes).join(" ");
  const sentences = combinedNotes
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const recurringWords = findRecurringWords(combinedNotes);

  return {
    source: "local",
    summary: `Reviewed ${entries.length} ${entries.length === 1 ? "entry" : "entries"} across ${types || "your notes"}.`,
    patterns: recurringWords.length
      ? [`Recurring terms: ${recurringWords.join(", ")}.`]
      : ["No strong recurring terms yet. Add a few more entries to make patterns clearer."],
    takeaways: sentences.slice(0, 3).map((sentence) => sentence.slice(0, 160)),
    actions: [
      "Choose one follow-up you can complete in the next 48 hours.",
      "Look for one question to ask in the next related conversation.",
      "Add a short note after the follow-up so the pattern stays visible."
    ]
  };
}

function findRecurringWords(text: string) {
  const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "and",
    "are",
    "but",
    "for",
    "from",
    "had",
    "have",
    "into",
    "not",
    "that",
    "the",
    "their",
    "there",
    "they",
    "this",
    "was",
    "with",
    "you"
  ]);

  const counts = text
    .toLowerCase()
    .match(/[a-z]{4,}/g)
    ?.filter((word) => !stopWords.has(word))
    .reduce<Record<string, number>>((acc, word) => {
      acc[word] = (acc[word] ?? 0) + 1;
      return acc;
    }, {});

  return Object.entries(counts ?? {})
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export async function generateInsight(entries: Entry[]): Promise<Insight> {
  if (!apiKey) {
    return {
      ...localInsight(entries),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      entryIds: entries.map((entry) => entry.id)
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You help one person review brief feedback, meeting, coaching, and conversation notes. Return concise JSON with summary, patterns, takeaways, and actions arrays."
        },
        {
          role: "user",
          content: entries.map(compactEntry).join("\n\n---\n\n")
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "personal_insight",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "patterns", "takeaways", "actions"],
            properties: {
              summary: { type: "string" },
              patterns: { type: "array", items: { type: "string" } },
              takeaways: { type: "array", items: { type: "string" } },
              actions: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("Could not generate insight. Check your API key and connection.");
  }

  const data = await response.json();
  const parsed = JSON.parse(data.output_text) as Pick<Insight, "summary" | "patterns" | "takeaways" | "actions">;

  return {
    ...parsed,
    source: "ai",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    entryIds: entries.map((entry) => entry.id)
  };
}
