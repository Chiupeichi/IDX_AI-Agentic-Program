import { classifyIntent } from "./classifier";
import type {
  AgentContext,
  AgentName,
  AgentRegistry,
  OrchestrationResult,
  OrchestrationSection,
  OrchestratorIntent,
} from "./types";

const routeByIntent: Partial<Record<OrchestratorIntent, AgentName>> = {
  search: "propertySearchAgent",
  market: "marketStatsAgent",
  recommend: "recommendationAgent",
  knowledge: "ragAgent",
  email: "emailDraftAgent",
};

function result(
  intent: OrchestratorIntent,
  sections: OrchestrationSection[]
): OrchestrationResult {
  const response =
    intent === "mixed"
      ? sections
          .map(({ agent, content }) => {
            const heading =
              agent === "propertySearchAgent"
                ? "🏠 Property matches"
                : "📊 Market context";
            return `${heading}\n${content}`;
          })
          .join("\n\n")
      : sections[0]?.content ??
        "I'm not sure how to help with that. Try asking about properties or market trends.";

  return {
    intent,
    agents: sections.map((section) => section.agent),
    sections,
    response,
  };
}

export async function orchestrate(
  query: string,
  userId: string,
  agents: AgentRegistry
): Promise<OrchestrationResult> {
  const normalizedQuery = query.trim();
  const normalizedUserId = userId.trim();
  if (!normalizedQuery) throw new Error("query is required");
  if (!normalizedUserId) throw new Error("userId is required");

  const intent = classifyIntent(normalizedQuery);
  const context: AgentContext = {
    query: normalizedQuery,
    userId: normalizedUserId,
  };

  if (intent === "mixed") {
    const [listings, stats] = await Promise.all([
      agents.propertySearchAgent(context),
      agents.marketStatsAgent(context),
    ]);
    return result(intent, [
      { agent: "propertySearchAgent", content: listings },
      { agent: "marketStatsAgent", content: stats },
    ]);
  }

  const agentName = routeByIntent[intent];
  if (!agentName) return result("unknown", []);

  const content = await agents[agentName](context);
  return result(intent, [{ agent: agentName, content }]);
}
