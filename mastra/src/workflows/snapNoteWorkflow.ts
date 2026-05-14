import { analyzeSnapNote } from "../agents/snapNoteAgent.js";
import type { SnapNoteAnalysisInput, SnapNoteAnalysisOutput } from "../schemas/snapNote.js";

export async function runSnapNoteWorkflow(
  input: SnapNoteAnalysisInput,
): Promise<SnapNoteAnalysisOutput> {
  return analyzeSnapNote(input);
}

