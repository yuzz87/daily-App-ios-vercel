import { Mastra } from "@mastra/core";
import { coffeeImageAgent } from "@/mastra/agents/coffee-image-agent";

export const mastra = new Mastra({
  agents: {
    coffeeImageAgent,
  },
});
