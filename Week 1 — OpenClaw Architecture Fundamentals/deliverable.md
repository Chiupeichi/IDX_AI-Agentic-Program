# Week 1 — OpenClaw Architecture Fundamentals

## 1. Objective
This week focused on understanding how OpenClaw routes user messages from WhatsApp through the runtime, skills, tools, and database layer before returning a response.

## 2. Repository Architecture Mapping

| Concept | Location in Repository | Role |
|---|---|---|
| Channels | `src/channels` | Handles communication interfaces such as WhatsApp |
| Gateway | `src/gateway` | Receives and forwards channel messages into OpenClaw |
| Agent Runtime | `src/agents/runtime` | Connects OpenClaw agent logic to the LLM runtime |
| Skills | `skills/` | Modular capabilities the agent can use |
| Tools | `src/agents/tools` | Executable functions called by the agent |
| Shared Packages | `packages/` | Core libraries such as `agent-core`, `llm-core`, and memory SDK |
| MySQL Database | local `idx_exchange` schema | Stores MLS datasets such as `rets_property` and `california_sold` |

## 3. Workflow Diagram

User  
→ WhatsApp  
→ OpenClaw Gateway  
→ Agent Runtime  
→ Skill Selector / Orchestrator  
→ MLS Skill  
→ Tool Execution  
→ MySQL Database  
→ Query Results  
→ Agent Response  
→ WhatsApp  
→ User

## 4. Runtime Notes

During source-code exploration, I reviewed `src/agents/runtime/index.ts` and found that OpenClaw wraps the shared `CoreAgent` from `packages/agent-core`. The runtime connects the agent to reusable LLM functions such as `completeSimple` and `streamSimple`.

I also reviewed the beginning of `src/agents/runtime/proxy.ts`, which handles proxied LLM streaming events, including text generation, thinking events, tool-call events, completion, and error handling.

## 5. Example MLS Query Flow

Example user query:

> Find homes in Irvine under $1M.

The WhatsApp message enters OpenClaw through the channel layer. The gateway forwards the message to the agent runtime. The orchestrator determines that the request should be handled by a property-search skill. The skill calls a database tool, which queries the local MySQL MLS database. The result is returned to the agent, formatted into a natural-language response, and sent back to the user through WhatsApp.

## 6. Key Takeaway

OpenClaw is not just a direct ChatGPT wrapper. It is a multi-agent orchestration system with separate layers for channels, gateway routing, agent runtime, tools, skills, memory, and database access.
