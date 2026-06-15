import { NextRequest } from "next/server";
import { mastra } from "@/mastra";
import { COFFEE_IMAGE_AGENT_ID } from "@/mastra/agents/coffee-image-agent";
import { CoffeeBeanAnalyzeSchema } from "@/mastra/schemas/coffee-bean-schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return Response.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Select an image file." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const agent = mastra.getAgentById(COFFEE_IMAGE_AGENT_ID);

    const result = await agent.generate(
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyze this coffee package image.
Read visible text from the image and return only JSON for the coffee_beans table.
Use null for fields that cannot be determined from the image.
Do not invent information that is not visible.
            `,
            },
            {
              type: "image",
              image: `data:${file.type};base64,${base64}`,
            },
          ],
        },
      ],
      {
        structuredOutput: {
          schema: CoffeeBeanAnalyzeSchema,
        },
      }
    );

    const validated = CoffeeBeanAnalyzeSchema.parse(result.object);

    return Response.json({ coffee_bean: validated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Image analysis failed." }, { status: 500 });
  }
}
