---
name: property-search
description: Search active California MLS listings from natural-language requests, including compact bed/bath phrases such as 2b2b and landmark searches such as near USC, then present numbered properties for an interactive WhatsApp selection.
metadata: { "openclaw": { "emoji": "🏠", "requires": { "bins": ["node", "npm"] } } }
---

# Interactive Property Search

Use this skill when a user asks to find, browse, choose, or refine active homes or mentions criteria such as a city, landmark, bedrooms, bathrooms, price, condo, townhouse, house, pool, or view.

## Search flow

1. Infer the current complete search request from the WhatsApp conversation. Supported examples include `2b2b near USC` and `我想找 USC 附近的 2b2b`.
2. If both city/landmark and bedroom count are missing, ask one short clarifying question. Budget and property type are optional.
3. From the workspace root, run the complete request with safe quoting:

```bash
npm run property:search -- --query "2b2b near USC"
```

4. Return the numbered results. Ask the user to reply with a number to choose a property or send new criteria to refine the search.
5. When the user replies with a number, use the matching numbered property from the immediately preceding assistant message. Confirm its address, price, beds/baths, area, and distance when available. Do not silently select a different result.
6. For a refinement such as `under 1.2m` or `condo only`, combine it with the location and bed/bath criteria already present in the conversation, then rerun the command with the complete request.

## Rules

- Treat USC, University of Southern California, and 南加大 as the USC landmark. The query searches active residential listings within five miles using coordinates, not a fake city named USC.
- The USC radius is currently fixed at five miles. Do not suggest that the user can change the radius; use price, property type, bed/bath, pool, or view refinements instead.
- `2b2b` means at least two bedrooms and two bathrooms.
- Never invent listings or distances. Return only command output backed by the local read-only database.
- Do not expose SQL, credentials, stack traces, internal paths, or Keychain details to the WhatsApp user.
- If there are no results, suggest widening the radius indirectly by choosing a nearby city or relaxing price/type filters; do not claim a listing exists.
