import { Brain, Loader2, Pin, Sparkles } from "lucide-react";
import type { Insight } from "../types";

type Props = {
  currentInsight: Insight | null;
  savedInsights: Insight[];
  selectedCount: number;
  isGenerating: boolean;
  onGenerate: () => void;
};

export default function InsightPanel({
  currentInsight,
  savedInsights,
  selectedCount,
  isGenerating,
  onGenerate
}: Props) {
  return (
    <aside className="insight-panel">
      <div className="panel-heading">
        <Brain size={20} />
        <h2>Insights</h2>
      </div>

      <button
        className="primary-button"
        type="button"
        onClick={onGenerate}
        disabled={!selectedCount || isGenerating}
        title="Generate insights from selected entries"
      >
        {isGenerating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        {selectedCount ? `Analyze ${selectedCount}` : "Select entries"}
      </button>

      {currentInsight ? <InsightView insight={currentInsight} /> : <div className="empty-state compact">Select one or more notes to see patterns, takeaways, and next actions.</div>}

      {savedInsights.length > 0 && (
        <section className="saved-insights">
          <div className="panel-heading small">
            <Pin size={16} />
            <h3>Recent insights</h3>
          </div>
          {savedInsights.slice(0, 3).map((insight) => (
            <div className="saved-insight" key={insight.id}>
              <p>{insight.summary}</p>
              <small>{new Date(insight.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}

function InsightView({ insight }: { insight: Insight }) {
  return (
    <section className="insight-result">
      <div className="source-pill">{insight.source === "ai" ? "AI generated" : "Local draft"}</div>
      <p className="summary">{insight.summary}</p>
      <InsightList title="Patterns" items={insight.patterns} />
      <InsightList title="Takeaways" items={insight.takeaways} />
      <InsightList title="Next actions" items={insight.actions} />
    </section>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="insight-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
