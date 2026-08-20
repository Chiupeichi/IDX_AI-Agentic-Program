export type OrchestratorIntent =
  | "search"
  | "market"
  | "recommend"
  | "knowledge"
  | "email"
  | "mixed"
  | "unknown";

export type AgentName =
  | "propertySearchAgent"
  | "marketStatsAgent"
  | "recommendationAgent"
  | "ragAgent"
  | "emailDraftAgent";

export type AgentContext = {
  query: string;
  userId: string;
};

export type SpecializedAgent = (context: AgentContext) => Promise<string>;

export type AgentRegistry = Record<AgentName, SpecializedAgent>;

export type OrchestrationSection = {
  agent: AgentName;
  content: string;
};

export type OrchestrationResult = {
  intent: OrchestratorIntent;
  agents: AgentName[];
  sections: OrchestrationSection[];
  response: string;
};
