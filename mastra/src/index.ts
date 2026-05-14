import { runSnapNoteWorkflow } from "./workflows/snapNoteWorkflow.js";

async function main() {
  const result = await runSnapNoteWorkflow({
    image_path: "example.jpg",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

