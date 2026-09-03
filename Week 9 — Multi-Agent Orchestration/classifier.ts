import type { OrchestratorIntent } from "./types";

const knowledgePatterns = [
  /\bwhat (?:does|is|are)\b/i,
  /\bdefine\b/i,
  /\bdefinition\b/i,
  /\bmeaning of\b/i,
  /\bwhat columns?\b/i,
  /\bmls fields?\b/i,
];

const searchPatterns = [
  /\bfind\b/i,
  /\bshow me\b/i,
  /\bsearch\b/i,
  /\b(?:homes?|houses?|properties|listings|condos?|townhomes?)\b/i,
  /\b\d+\s*(?:bed(?:room)?s?|b\d+b)\b/i,
  /\b(?:under|below|max(?:imum)?|up to)\s*\$?\s*[\d,.]+\s*(?:k|m|million|thousand)?\b/i,
  /\b(?:pool|view|single[-\s]?family|condo|townhome)\b/i,
  /^(?:#|option\s*)?\d+$/i,
  /^(?:reset|restart|start over)$/i,
];

const searchActionPatterns = [
  /\bfind\b/i,
  /\bshow me\b/i,
  /\bsearch\b/i,
  /\b(?:looking|look) for\b/i,
  /\bwhat (?:homes?|houses?|properties|listings|condos?|townhomes?) (?:are|can)\b/i,
];

const marketPatterns = [
  /\bmarket\b/i,
  /\bgood time to (?:buy|sell)\b/i,
  /\bmarket conditions?\b/i,
  /\bprices? (?:are )?(?:rising|falling|trending)\b/i,
  /\b(?:median|average) (?:home |close )?price\b/i,
  /\bprice per (?:square foot|sq\.?\s*ft\.?)\b/i,
  /\binventory\b/i,
  /\b(?:mom|yoy|month-over-month|year-over-year)\b/i,
  /\b(?:buyer's|seller's) market\b/i,
];

const recommendationPatterns = [
  /\brecommend/i,
  /\bsimilar (?:homes?|properties|listings)\b/i,
  /\b(?:homes?|properties|listings) similar to\b/i,
  /\b(?:homes?|properties|listings) like (?:this|that|it)\b/i,
  /\balternatives?\b/i,
  /\bcomparable (?:homes?|properties|listings)\b/i,
];

const emailPatterns = [
  /\bdraft (?:an? )?email\b/i,
  /\bemail (?:me|this|these|the)\b/i,
  /\bcompose (?:an? )?email\b/i,
  /\bproperty summary email\b/i,
  /\bmarket summary email\b/i,
  /\b(?:draft|compose|email) (?:an? )?(?:weekly )?(?:market report|listing alert|property summary|recommendation digest)\b/i,
  /\b(?:approve|cancel) (?:the )?email\b/i,
];

function matchesAny(query: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(query));
}

export function classifyIntent(query: string): OrchestratorIntent {
  const normalized = query.trim();
  if (!normalized) return "unknown";

  if (matchesAny(normalized, emailPatterns)) return "email";
  if (matchesAny(normalized, recommendationPatterns)) return "recommend";

  const isKnowledge = matchesAny(normalized, knowledgePatterns);
  const isSearch = matchesAny(normalized, searchPatterns);
  const isSearchAction = matchesAny(normalized, searchActionPatterns);
  const isMarket = matchesAny(normalized, marketPatterns);

  if (isSearchAction && isMarket) return "mixed";
  if (isMarket) return "market";
  if (isSearch) return "search";
  if (isKnowledge) return "knowledge";
  return "unknown";
}
