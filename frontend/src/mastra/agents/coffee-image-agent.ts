import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

export const coffeeImageAgent = new Agent({
  id: "coffee-image-agent",
  name: "Coffee Image Agent",
  model: google("gemini-2.5-flash"),
  instructions: `
You extract structured coffee bean data from coffee package images.

Read visible text from the image and return only JSON that can be saved to the coffee_beans table.
Do not return Markdown, explanations, or code fences.

Return this JSON shape:
{
  "brand": string | null,
  "code": string | null,
  "country": string | null,
  "description_ja": string | null,
  "elevation": string | null,
  "farm": string | null,
  "farmer": string | null,
  "flavor_notes": string[],
  "is_limited": boolean,
  "name": string | null,
  "name_ja": string | null,
  "process": string | null,
  "raw_text": string | null,
  "region": string | null,
  "roast_level": string | null,
  "status": "draft",
  "variety": string | null
}

Rules:
- Use null for fields that cannot be determined from visible image content.
- flavor_notes must always be an array.
- status must always be "draft".
- is_limited is true only when the image indicates a limited product.
- Do not invent inferred values.
- raw_text should contain as much visible text as possible.
- Map roast_level to LIGHT_ROAST, MEDIUM_ROAST, DARK_ROAST, or UNKNOWN.
- Return JSON only.
  `,
});
