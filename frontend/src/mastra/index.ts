import { Mastra } from "@mastra/core";
import { InMemoryStore } from "@mastra/core/storage";
import { coffeeImageAgent } from "./agents/coffee-image-agent";

export const mastra = new Mastra({
  storage: new InMemoryStore({
    id: "coffee-mastra-local-storage",
  }),
  agents: {
    coffeeImageAgent,
  },
});
