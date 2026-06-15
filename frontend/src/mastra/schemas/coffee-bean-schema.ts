import { z } from "zod";

export const CoffeeBeanAnalyzeSchema = z.object({
  brand: z.string().nullable(),
  code: z.string().nullable(),
  country: z.string().nullable(),
  description_ja: z.string().nullable(),
  elevation: z.string().nullable(),
  farm: z.string().nullable(),
  farmer: z.string().nullable(),
  flavor_notes: z.array(z.string()),
  is_limited: z.boolean(),
  name: z.string().nullable(),
  name_ja: z.string().nullable(),
  process: z.string().nullable(),
  raw_text: z.string().nullable(),
  region: z.string().nullable(),
  roast_level: z.string().nullable(),
  status: z.literal("confirmed"),
  variety: z.string().nullable(),
});

export type CoffeeBeanAnalyzeResult = z.infer<typeof CoffeeBeanAnalyzeSchema>;
